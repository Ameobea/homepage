#![allow(invalid_value)]

use std::f32;
use std::mem;
use std::panic;
use std::ptr;
use std::usize;

use ncollide2d::bounding_volume::{aabb::AABB, BoundingVolume};
use ncollide2d::na::{Isometry2, Point2, Vector2};
use ncollide2d::partitioning::{DBVTLeaf, DBVTLeafId, VisitStatus, Visitor, BVH, DBVT};
use rand::Rng;
use rand_core::SeedableRng;
use rand_pcg::Pcg32;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(raw_module = "../src/triangleHooks.tsx")]
extern "C" {
    #[allow(clippy::too_many_arguments)]
    pub fn render_triangle(
        x1: f32,
        y1: f32,
        x2: f32,
        y2: f32,
        x3: f32,
        y3: f32,
        color: &str,
        border_color: &str,
    ) -> usize;
    pub fn delete_elem(elem_id: usize);
}

type TriangleBuf = [Point2<f32>; 3];

const PLACEMENT_ATTEMPTS: usize = 5;
const PLACEMENT_BAILOUT_THRESHOLD: usize = 1000;
const CHAIN_COUNT: usize = 3;

#[derive(Clone)]
pub struct Conf {
    pub prng_seed: f64,
    pub canvas_width: usize,
    pub canvas_height: usize,
    pub triangle_size: f32,
    pub triangle_count: usize,
    pub max_rotation_rads: f32,
    pub triangle_color: String,
    pub triangle_border_color: String,
    pub rotation_offset: f32,
    pub generation_rate: f32,
}

impl Conf {
    /// Returns `(offset_x, offset_y)`
    fn get_base_triangle_offsets(&self) -> (f32, f32) {
        let triangle_offset_x = self.triangle_size / 2.0;
        (
            triangle_offset_x,
            ((self.triangle_size * self.triangle_size) - (triangle_offset_x * triangle_offset_x))
                .sqrt(),
        )
    }
}

fn get_triangle_bv(triangle: &TriangleBuf) -> AABB<f32> {
    let (min, max) = bounds(triangle[0], triangle[1], triangle[2]);
    AABB::new(min, max)
}

fn get_initial_triangle(
    chain_ix: usize,
    conf: &Conf,
    base_triangle_coords: &TriangleBuf,
) -> (TriangleBuf, f32) {
    let initial_offset = Vector2::new(
        rng().gen_range(
            conf.triangle_size,
            conf.canvas_width as f32 - conf.triangle_size,
        ),
        rng().gen_range(
            conf.triangle_size,
            conf.canvas_height as f32 - conf.triangle_size,
        ),
    );
    let rotation = rng().gen_range(0.0, f32::consts::PI / 2.0);
    let proposed_first_triangle = [
        base_triangle_coords[0] + initial_offset,
        base_triangle_coords[1] + initial_offset,
        base_triangle_coords[2] + initial_offset,
    ];
    // verify that this proposed initial triangle doesn't intersect any existing triangles
    let bounding_box = get_triangle_bv(&proposed_first_triangle);
    let mut does_collide = false;
    let mut visitor = TriangleCollisionVisitor {
        triangle: &proposed_first_triangle,
        triangle_bv: &bounding_box,
        // triangles: unsafe { &*TRIANGLES },
        does_collide: &mut does_collide,
    };
    world().visit(&mut visitor);
    if does_collide {
        return get_initial_triangle(chain_ix, conf, base_triangle_coords);
    }

    (proposed_first_triangle, rotation)
}

struct Env {
    pub chain_ix: usize,
    pub conf: Conf,
    // pub triangle_offset_x: f32,
    // pub triangle_offset_y: f32,
    pub base_triangle_coords: TriangleBuf,
    pub last_triangle: TriangleBuf,
    pub last_triangle_ix: usize,
    pub rotation: f32,
    pub oldest_triangle_ix: usize,
}

impl Env {
    pub fn new(conf: Conf, chain_ix: usize) -> Self {
        // Re-seed the global PRNG
        *rng() = Pcg32::from_seed(unsafe { mem::transmute((conf.prng_seed, conf.prng_seed)) });
        let (triangle_offset_x, triangle_offset_y) = conf.get_base_triangle_offsets();

        let base_triangle_coords = [
            Point2::origin(),
            p2(-triangle_offset_x, triangle_offset_y),
            p2(triangle_offset_x, triangle_offset_y),
        ];
        let (last_triangle, rotation) =
            get_initial_triangle(chain_ix, &conf, &base_triangle_coords);

        Env {
            chain_ix,
            conf,
            // triangle_offset_x,
            // triangle_offset_y,
            base_triangle_coords,
            last_triangle_ix: usize::MAX,
            last_triangle,
            rotation,
            oldest_triangle_ix: usize::MAX,
        }
    }

    pub fn set_new_last_triangle(&mut self) {
        let triangle_count = triangles(self.chain_ix).len();
        if triangle_count == 0 {
            let (triangle, rotation) =
                get_initial_triangle(self.chain_ix, &self.conf, &self.base_triangle_coords);
            self.rotation = rotation;
            self.last_triangle = triangle;
            self.last_triangle_ix = usize::MAX;
            return;
        }

        let ix = rng().gen_range(0, triangle_count);
        if ix == self.oldest_triangle_ix {
            return self.set_new_last_triangle();
        }
        self.last_triangle = triangles(self.chain_ix)[ix].geometry;
        self.last_triangle_ix = ix;
    }

    #[inline(always)]
    pub fn triangles(&self) -> &'static Vec<TriangleHandle> {
        triangles(self.chain_ix)
    }

    #[inline(always)]
    pub fn triangles_mut(&self) -> &'static mut Vec<TriangleHandle> {
        triangles_mut(self.chain_ix)
    }

    #[inline(always)]
    pub fn get_triangle(&self, i: usize) -> &'static TriangleHandle {
        get_triangle(self.chain_ix, i)
    }

    #[inline(always)]
    pub fn get_triangle_mut(&self, i: usize) -> &'static mut TriangleHandle {
        get_triangle_mut(self.chain_ix, i)
    }
}

#[derive(Debug)]
struct TriangleHandle {
    pub geometry: TriangleBuf,
    pub collider_handle: DBVTLeafId,
    pub dom_id: usize,
    pub prev_node: Option<usize>,
    pub next_node_1: Option<usize>,
    pub next_node_2: Option<usize>,
}

impl TriangleHandle {
    pub fn degree(&self) -> usize {
        let mut degree = 0;
        for link in &[self.prev_node, self.next_node_1, self.next_node_2] {
            if link.is_some() {
                degree += 1;
            }
        }
        degree
    }
}

#[inline(always)]
fn p2(x: f32, y: f32) -> Point2<f32> {
    Point2::new(x, y)
}

#[inline]
fn render_triangle_array(triangle: &TriangleBuf, color: &str, border_color: &str) -> usize {
    let [p1, p2, p3] = *triangle;
    render_triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, color, border_color)
}

/// Clear out the collision world and empty the geometry buffer
fn reinitialize_global_state() {
    let world = unsafe { &mut *COLLISION_WORLD };
    let triangles = unsafe { &mut *TRIANGLES };
    *world = DBVT::new();
    triangles.iter_mut().for_each(|v| v.clear())
}

/// DBVT with custom data as `(chain_ix, triangle_ix)`
type World = DBVT<f32, (usize, usize), AABB<f32>>;
static mut COLLISION_WORLD: *mut World = ptr::null_mut();
static mut TRIANGLES: *mut [Vec<TriangleHandle>; CHAIN_COUNT] = ptr::null_mut();
static mut RNG: *mut Pcg32 = ptr::null_mut();
static mut ENVS: *mut [Env; CHAIN_COUNT] = ptr::null_mut();

#[inline(always)]
fn rng() -> &'static mut Pcg32 {
    unsafe { &mut *RNG }
}

#[inline(always)]
fn triangles(chain_ix: usize) -> &'static Vec<TriangleHandle> {
    if cfg!(debug_assertions) {
        unsafe { &(&*TRIANGLES)[chain_ix] }
    } else {
        unsafe { (&*TRIANGLES).get_unchecked(chain_ix) }
    }
}

#[inline(always)]
fn triangles_mut(chain_ix: usize) -> &'static mut Vec<TriangleHandle> {
    if cfg!(debug_assertions) {
        unsafe { &mut (&mut *TRIANGLES)[chain_ix] }
    } else {
        unsafe { (&mut *TRIANGLES).get_unchecked_mut(chain_ix) }
    }
}

#[inline(always)]
fn get_triangle(chain_ix: usize, i: usize) -> &'static TriangleHandle {
    if cfg!(debug_assertions) {
        unsafe { &(&mut *TRIANGLES)[chain_ix][i] }
    } else {
        unsafe { (&*TRIANGLES).get_unchecked(chain_ix).get_unchecked(i) }
    }
}

#[inline(always)]
fn get_triangle_mut(chain_ix: usize, i: usize) -> &'static mut TriangleHandle {
    if cfg!(debug_assertions) {
        unsafe { &mut (&mut *TRIANGLES)[chain_ix][i] }
    } else {
        unsafe {
            (&mut *TRIANGLES)
                .get_unchecked_mut(chain_ix)
                .get_unchecked_mut(i)
        }
    }
}

#[inline(always)]
fn world() -> &'static mut World {
    unsafe { &mut *COLLISION_WORLD }
}

#[wasm_bindgen]
pub fn init_triangles(canvas_width: usize, canvas_height: usize) {
    if cfg!(debug_assertions) {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
    }

    let world: Box<World> = Box::new(DBVT::new());
    let p: *mut World = Box::into_raw(world);
    unsafe { COLLISION_WORLD = p };

    let triangles: Box<[Vec<TriangleHandle>; CHAIN_COUNT]> =
        unsafe { Box::new(mem::MaybeUninit::uninit().assume_init()) };
    let p: *mut [Vec<TriangleHandle>; CHAIN_COUNT] = Box::into_raw(triangles);
    for i in 0..CHAIN_COUNT {
        unsafe {
            ptr::write(
                (p as *mut Vec<TriangleHandle>).add(i),
                Vec::with_capacity(200),
            )
        };
    }

    unsafe { TRIANGLES = p };

    let rng_seed: [u8; 16] = unsafe { mem::transmute(1u128) };
    let rng: Box<Pcg32> = Box::new(Pcg32::from_seed(rng_seed));
    let p: *mut Pcg32 = Box::into_raw(rng);
    unsafe { RNG = p };
    unsafe { ENVS = Box::into_raw(Box::new(mem::MaybeUninit::uninit().assume_init())) };

    let default_conf = Conf {
        prng_seed: 9209.2338,
        canvas_width,
        canvas_height,
        triangle_size: 12.25,
        triangle_count: 50,
        max_rotation_rads: 0.5,
        triangle_color: "".into(),
        triangle_border_color: "".into(),
        rotation_offset: 60.0,
        generation_rate: 26.0,
    };
    let colors: [(String, String); CHAIN_COUNT] = [
        ("rgb(81, 12, 84)".into(), "rgb(226, 12, 163)".into()),
        ("rgb(9, 89, 135)".into(), "rgb(15, 190, 230)".into()),
        ("rgb(9, 112, 5)".into(), "rgb(36, 189, 6)".into()),
        // ("rgb(135, 63, 22)".into(), "rgb(255, 144, 6)".into()),
        // ("rgb(125, 33, 33)".into(), "rgb(255, 6, 6)".into()),
    ];
    for (i, (triangle_color, triangle_border_color)) in colors.iter().enumerate() {
        let mut conf = default_conf.clone();
        conf.triangle_color = triangle_color.clone();
        conf.triangle_border_color = triangle_border_color.clone();
        unsafe { ptr::write((ENVS as *mut Env).add(i), Env::new(conf, i)) };
    }
}

#[inline]
const fn deg_to_rad(degrees: f32) -> f32 {
    degrees * (f32::consts::PI / 180.0)
}

#[inline]
fn min3(a: f32, b: f32, c: f32) -> f32 {
    a.min(b).min(c)
}

#[inline]
fn max3(a: f32, b: f32, c: f32) -> f32 {
    a.max(b).max(c)
}

#[inline]
fn bounds(v1: Point2<f32>, v2: Point2<f32>, v3: Point2<f32>) -> (Point2<f32>, Point2<f32>) {
    (
        p2(min3(v1.x, v2.x, v3.x), min3(v1.y, v2.y, v3.y)),
        p2(max3(v1.x, v2.x, v3.x), max3(v1.y, v2.y, v3.y)),
    )
}

#[inline]
fn ccw(p1: Point2<f32>, p2: Point2<f32>, p3: Point2<f32>) -> bool {
    (p3.y - p1.y) * (p2.x - p1.x) >= (p2.y - p1.y) * (p3.x - p1.x)
}

/// adapted from https://stackoverflow.com/a/9997374/3833068
#[inline]
fn check_line_seg_intersection(
    l1p1: Point2<f32>,
    l1p2: Point2<f32>,
    l2p1: Point2<f32>,
    l2p2: Point2<f32>,
) -> bool {
    ccw(l1p1, l2p1, l2p2) != ccw(l1p2, l2p1, l2p2) && ccw(l1p1, l1p2, l2p1) != ccw(l1p1, l1p2, l2p2)
}

/// If any side of the first triangle intersects any side of the second triangle, they intersect.
/// Additionally, if two sides of the first triangle don't intersect, the triangles don't
/// intersect.
fn check_triangle_collision(t1: &TriangleBuf, t2: &TriangleBuf) -> bool {
    for (l1p1, l1p2) in &[(t1[0], t1[1]), (t1[1], t1[2]), (t1[2], t1[0])] {
        for (l2p1, l2p2) in &[(t2[0], t2[1]), (t2[1], t2[2]), (t2[2], t2[0])] {
            if check_line_seg_intersection(*l1p1, *l1p2, *l2p1, *l2p2) {
                return true;
            }
        }
    }

    false
}

struct TriangleCollisionVisitor<'a> {
    pub triangle: &'a TriangleBuf,
    pub triangle_bv: &'a AABB<f32>,
    // pub triangles: &'a [Vec<TriangleHandle>; CHAIN_COUNT],
    pub does_collide: &'a mut bool,
}

impl<'a> Visitor<(usize, usize), AABB<f32>> for TriangleCollisionVisitor<'a> {
    fn visit(&mut self, bv: &AABB<f32>, data: Option<&(usize, usize)>) -> VisitStatus {
        if let Some(&(chain_ix, triangle_ix)) = data {
            // We reached a leaf node, so we check to see if our candidate triangle collides with it
            if check_triangle_collision(
                &self.triangle,
                &get_triangle(chain_ix, triangle_ix).geometry,
            ) {
                *self.does_collide = true;
                VisitStatus::ExitEarly
            } else {
                VisitStatus::Stop
            }
        } else if self.triangle_bv.intersects(bv) {
            // The BV of our candidate triangle collides with the BV of this level of the BVH
            VisitStatus::Continue
        } else {
            // Nothing collides, so we bail out of this branch of the tree
            VisitStatus::Stop
        }
    }
}

/// Attempts to find a valid rotation for the next triangle, returning the proposed triangle if it
/// is found.
fn find_triangle_placement(
    env: &Env,
    origin: Point2<f32>,
    rotation: f32,
) -> Option<(AABB<f32>, TriangleBuf)> {
    let Env {
        conf: Conf {
            max_rotation_rads, ..
        },
        base_triangle_coords,
        ..
    } = env;

    let proposed_rotation =
        rotation + rng().gen_range(-*max_rotation_rads, *max_rotation_rads + 0.00001);
    // determine if this proposed triangle would intersect any other triangle
    let proposed_isometry = Isometry2::new(Vector2::new(origin.x, origin.y), proposed_rotation);
    let proposed_triangle = [
        proposed_isometry * base_triangle_coords[0],
        proposed_isometry * base_triangle_coords[1],
        proposed_isometry * base_triangle_coords[2],
    ];
    let pt_within_canvas = |pt: &Point2<f32>| {
        pt.x > 0.
            && pt.x < env.conf.canvas_width as f32
            && pt.y > 0.
            && pt.y < env.conf.canvas_height as f32
    };
    if proposed_triangle.iter().any(|pt| !pt_within_canvas(pt)) {
        return None;
    }
    let bounding_box = get_triangle_bv(&proposed_triangle);

    let mut does_collide = false;
    let mut visitor = TriangleCollisionVisitor {
        triangle: &proposed_triangle,
        triangle_bv: &bounding_box,
        // triangles: unsafe { &*TRIANGLES },
        does_collide: &mut does_collide,
    };
    world().visit(&mut visitor);

    if !does_collide {
        // we've found a valid triangle placement
        Some((bounding_box, proposed_triangle))
    } else {
        None
    }
}

fn generate_triangle(env: &mut Env) -> Option<(AABB<f32>, TriangleBuf)> {
    // pick one of the other two vertices to use as the new origin
    let (ix, rot_offset) = if rng().gen_range(0, 2) == 0 {
        (1, deg_to_rad(env.conf.rotation_offset))
    } else {
        (2, deg_to_rad(-env.conf.rotation_offset))
    };

    let origin = env.last_triangle[ix];
    for _ in 0..PLACEMENT_ATTEMPTS {
        let placement_opt = find_triangle_placement(env, origin, env.rotation + rot_offset);
        if let Some((bv, triangle)) = placement_opt {
            env.rotation += rot_offset;
            return Some((bv, triangle));
        }
    }

    None // failed to place a triangle at this origin in `PLACEMENT_ATTTEMPTS` attempts
}

fn place_triangle(env: &mut Env, insert_at_oldest_ix: bool) -> Option<()> {
    for _ in 0..PLACEMENT_BAILOUT_THRESHOLD {
        if let Some((bv, triangle)) = generate_triangle(env) {
            let dom_id = render_triangle_array(
                &triangle,
                &env.conf.triangle_color,
                &env.conf.triangle_border_color,
            );
            let insertion_ix = if insert_at_oldest_ix {
                env.oldest_triangle_ix
            } else {
                env.triangles().len()
            };
            let leaf_id = world().insert(DBVTLeaf::new(bv, (env.chain_ix, insertion_ix)));

            let handle = TriangleHandle {
                dom_id,
                collider_handle: leaf_id,
                geometry: triangle,
                prev_node: if env.last_triangle_ix == usize::MAX {
                    None
                } else {
                    Some(env.last_triangle_ix)
                },
                next_node_1: None,
                next_node_2: None,
            };
            if insert_at_oldest_ix {
                *env.get_triangle_mut(env.oldest_triangle_ix) = handle;
            } else {
                env.triangles_mut().push(handle);
            }

            if env.last_triangle_ix != usize::MAX {
                let last_triangle = env.get_triangle_mut(env.last_triangle_ix);
                match (last_triangle.next_node_1, last_triangle.next_node_2) {
                    (Some(_), None) => {
                        last_triangle.next_node_2 = Some(insertion_ix);
                        debug_assert!(last_triangle.next_node_2 != last_triangle.prev_node);
                        debug_assert!(last_triangle.next_node_2 != last_triangle.next_node_1);
                    }
                    (None, Some(_)) | (None, None) => {
                        last_triangle.next_node_1 = Some(insertion_ix);
                        debug_assert!(last_triangle.next_node_1 != last_triangle.prev_node);
                        debug_assert!(last_triangle.next_node_1 != last_triangle.next_node_2);
                    }
                    (Some(_), Some(_)) => {
                        panic!("Tried to add new triangle to triangle with two children");
                    }
                }
            }
            env.last_triangle = triangle;
            env.last_triangle_ix = insertion_ix;
            return Some(());
        }

        // we failed to place a triangle at this origin; we have to pick a new origin point.
        env.set_new_last_triangle();
    }

    None
}

#[wasm_bindgen]
pub fn render(chain_ix: usize) {
    if chain_ix == 0 {
        reinitialize_global_state();
    }
    let mut env = unsafe { &mut (*ENVS)[chain_ix] };

    // place `triangle_count` triangles
    for _ in 0..env.conf.triangle_count {
        place_triangle(&mut env, false);
    }
}

/// Delete the oldest generated triangle and generate a new triangle.
#[wasm_bindgen]
pub fn generate(chain_ix: usize) {
    let env: &mut Env = unsafe { &mut (&mut *ENVS)[chain_ix] };
    let assert_handle_valid = |handle: &TriangleHandle| {
        debug_assert!(handle.degree() != 0);
        debug_assert!(!(handle.next_node_1 == handle.next_node_2 && handle.next_node_1.is_some()));
        debug_assert!(!(handle.next_node_1 == handle.prev_node && handle.next_node_1.is_some()));
        debug_assert!(!(handle.next_node_2 == handle.prev_node && handle.next_node_2.is_some()));
    };
    env.triangles().iter().for_each(assert_handle_valid);
    if env.oldest_triangle_ix == env.last_triangle_ix {
        env.set_new_last_triangle();
    }

    let child_degree_is_not_one = |link: &Option<usize>| -> bool {
        if let Some(child_ix) = link {
            env.get_triangle(*child_ix).degree() != 1
        } else {
            true
        }
    };

    let triangle_valid = if env.oldest_triangle_ix != usize::MAX {
        let oldest_triangle = env.get_triangle(env.oldest_triangle_ix);
        let triangle_valid = oldest_triangle.degree() == 1
            && [
                oldest_triangle.prev_node,
                oldest_triangle.next_node_1,
                oldest_triangle.next_node_2,
            ]
            .iter()
            .all(child_degree_is_not_one);
        if triangle_valid {
            delete_elem(oldest_triangle.dom_id);
            world().remove(oldest_triangle.collider_handle);
            if let Some(prev_ix) = oldest_triangle.prev_node {
                if env.get_triangle(prev_ix).next_node_1 == Some(env.oldest_triangle_ix) {
                    env.get_triangle_mut(prev_ix).next_node_1 = None;
                } else if env.get_triangle(prev_ix).next_node_2 == Some(env.oldest_triangle_ix) {
                    env.get_triangle_mut(prev_ix).next_node_2 = None;
                } else {
                    panic!("Tried to delete triangle but its parent doesn't list it as its child");
                }
            }
            if let Some(child_ix) = oldest_triangle.next_node_1 {
                debug_assert!(env.get_triangle(child_ix).prev_node == Some(env.oldest_triangle_ix));
                env.get_triangle_mut(child_ix).prev_node = None;
            }
            if let Some(child_ix) = oldest_triangle.next_node_2 {
                debug_assert!(env.get_triangle(child_ix).prev_node == Some(env.oldest_triangle_ix));
                env.get_triangle_mut(child_ix).prev_node = None;
            }

            place_triangle(env, true);
        }
        triangle_valid
    } else {
        false
    };

    if env.oldest_triangle_ix < env.conf.triangle_count - 1 {
        env.oldest_triangle_ix += 1;
    } else {
        env.oldest_triangle_ix = 0;
    }

    if !triangle_valid {
        generate(chain_ix);
    }
}

#[test]
fn triangle_intersection() {
    let triangle1 = [
        p2(305.66763, 439.45938),
        p2(278.40073, 428.20035),
        p2(282.28357, 457.4437),
    ];
    let triangle2 = [
        p2(290.44968, 472.76297),
        p2(310.24722, 450.89273),
        p2(281.4083, 444.68268),
    ];

    assert!(check_triangle_collision(&triangle1, &triangle2));
}
