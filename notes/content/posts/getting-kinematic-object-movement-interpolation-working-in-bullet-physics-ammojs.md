+++
title = "Getting Kinematic Object Movement Interpolation Working in Bullet Physics/ammo.js"
date = "2025-03-14T16:07:46-07:00"
+++

## Background

I'm working on a browser-based [game engine](https://github.com/ameobea/sketches-3d) that uses Three.JS for rendering and a WebAssembly port of the Bullet physics engine called [ammo.js](https://github.com/kripken/ammo.js) for its physics engine and character controller.

Bullet is a very old physics engine and Ammo.JS is more or less a direct copy of it with a few changes to support usage in the browser. There are a lot of rough edges and things you have to figure out yourself in order to use it.

## The Problem

One problem I ran into was getting interpolated position changes to work for kinematic objects. Let's way that your game's animation frame is firing at 60FPS and you have the Bullet physics engine configured to run at a static 180hz tick rate. This means that for every animation frame, there will be 3 simulated physics engine ticks.

I had some kinematic objects that I controlled manually from the JS side. I computed and set the positions of the objects each animation frame, applying the new position to both Three.JS and ammo.js/bullet simultaneously. I set their transforms in bullet via the `btMotionState` interface which, according to code comments and docs, should help support interpolated movement and continuous collision detection.

**I was running into problems where fast-moving kinematic objects would clip through the player or otherwise bug out when colliding.**

No matter how high I turned up the physics engine tick rate, the problem wouldn't improve. Theoretically, at some point turning the tick rate high enough should resolve the issues since the movement between each internal tick will eventually be small enough to prevent the clipping.

## The Cause

It turns out that continuous collision detection (referred to as CCD in bullet code and docs) is complicated and doesn't really work by default.

For starters, I was using the `btDiscreteCollisionWorld` for my game engine. This has "discrete" in the name, so I guess it's not really much of a surprise that it doesn't do much continuous stuff out of the box. For what it's worth, there is no continuous collision world that I could find which is shipped with ammo.js.

After much digging through the code, I found some other places where continuous collision detection is used when solving individual collisions between objects. If an object has an associated `btMotionState`, the new position of the object is queried at the beginning of each call to `btDiscreteDynamicsWorld::stepSimulation`. This happens in the `saveKinematicState` function.

That function computes linear and angular velocities for objects that have moved. These velocities are then used by CCD, but weren't really having any effect as far as I could tell. This is probably because the actual `worldTransform` of the object isn't interpolated for the internal sub-ticks simulated by bullet (`internalSingleStepSimulation`). As a result, my character controller was seeing the objects at their final point at the end of the simulated frame rather than seeing its movement interpolated along sub-ticks.

## The Solution

**To resolve this, I manually interpolated the world transform of kinematic collision objects each subtick.**

Then, I added a new `applyManualMotionStateInterpolation` method to `btDiscreteDynamicsWorld` which I call before each time `internalSingleStepSimulation` is run. `applyManualMotionStateInterpolation` uses that `m_lastWorldTransform` variable along with the velocities computed in `saveKinematicState` to simulate the transform of the object `dt` seconds after the end of the last frame.

Here's the full function:

```cpp
/**
 * This is some custom stuff I added to get interpolated positions of kinematic objects for internal
 * subticks.  The built-in interpolation doesn't seem to work for kinematic objects, and this forces
 * interpolation between the past and most recently set transforms for kinematic objects.
 */
void btDiscreteDynamicsWorld::applyManualMotionStateInterpolation(btScalar dt) {
	for (int i = 0; i < m_nonStaticRigidBodies.size(); i++){
		btRigidBody* body = m_nonStaticRigidBodies[i];
		if (body->isActive() && body->isKinematicObject()) {
			auto startPos = body->getLastFrameWorldTransform();
			btTransform dstPos;
			btTransformUtil::integrateTransform(
				startPos,
				body->getInterpolationLinearVelocity(),
				body->getInterpolationAngularVelocity(),
				dt,
				dstPos
			);
			body->setWorldTransform(dstPos);
			body->setLastFrameWorldTransform(dstPos);
		}
	}
}
```

It uses the pre-existing `integrateTransform` to apply the velocities which is where the math and heavy lifting happens. Then, it sets the simulated destination position into `m_worldTransform` via `setWorldTransform` - which is the actual live position of the object used in physics simulations.

I needed to make one additional change to the `saveKinematicState` function in order for this to be valid when using fixed tick-rate mode for bullet:

```diff
void btRigidBody::saveKinematicState(btScalar timeStep)
{
	//todo: clamp to some (user definable) safe minimum timestep, to limit maximum angular/linear velocities
	if (timeStep != btScalar(0.))
	{
+		m_interpolationWorldTransform = m_worldTransform;

		//if we use motionstate to synchronize world transforms, get the new kinematic/animated world transform
		if (getMotionState())
			getMotionState()->getWorldTransform(m_worldTransform);

		btTransformUtil::calculateVelocity(m_interpolationWorldTransform,m_worldTransform,timeStep,m_linearVelocity,m_angularVelocity);
		m_interpolationLinearVelocity = m_linearVelocity;
		m_interpolationAngularVelocity = m_angularVelocity;
		m_interpolationWorldTransform = m_worldTransform;
	} else {
		printf("Zero timestep???\n");
	}
}
```

Without that change, the transforms of objects affected by this manual interpolation wouldn't reflect the portion of the movement from the remainder of the `dt`. `m_interpolationWorldTransform` is the transform that the object should have by the end of the current tick, but it doesn't quite make it there due to that remainder.

Setting `m_interpolationWorldTransform` equal to `m_worldTransform` works around this by computing the motion as starting from the last simulated point of the object rather than the last set point.

## Results

**As a result of these fixes, I was able to actually benefit from turning up the simulation tick rate and my collision issues with fast-moving kinematic objects vastly improved.**

Note that this fix might not be valid for all bullet physics configurations. If you do stuff like setting your `btDispatcher`'s `m_dispatchFunc` to `DISPATCH_CONTINUOUS` (it defaults to `DISPATCH_DISCRETE`) or maybe even just use certain types of collision objects, this might result in incorrect physics if the CCD (which seems to be inactive and do nothing in my case) actually gets used somewhere.

## Other Misc. Notes

- Use specialized collision objects like `btBoxShape` when possible rather than `btTriangleMesh`. These seem to behave much better (less clipping through fast-moving objects, jitter, inaccurate displacements, etc.) and are much more performant.

- The built-in [`btKinematicCharacterController`](https://github.com/kripken/ammo.js/blob/main/bullet/src/BulletDynamics/Character/btKinematicCharacterController.cpp) doesn't work well out of the box. They note this in their official docs, and its code hasn't been touched in a decade or more. It also requires careful tuning of constants like jump height, step height, max penetration depth, physics engine tick length, and more in order to get decent results.

I had to make numerous tweaks and customizations to get the character controller working well for my use case. I also added a variety of extra features like clamping the character to moving platforms, adding external velocity for things like directional dashes and jump pads, etc. These changes can be found on [my fork](https://github.com/Ameobea/ammo.js/tree/updates).
