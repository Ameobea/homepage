import matplotlib.pyplot as plt
import numpy as np

# Define the triangle vertices
triangle_vertices = np.array([
    [0, 0],  # Vertex A
    [2, 1],  # Vertex B
    [1, 1.5] # Vertex C
])

def compute_angle_and_label(p1, p2):
    """Compute the angle of the line from p1 to p2 relative to the x-axis and generate a label for it."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    angle = np.arctan2(dy, dx)
    angle_deg = np.degrees(angle)
    label = f"{angle_deg:.2f}°"
    return angle, label

def plot_arc_with_arrow(ax, center, radius, start_angle, end_angle, color):
    """Plot an arc with an arrow to indicate direction."""
    theta = np.linspace(np.radians(start_angle), np.radians(end_angle), 100)
    x = center[0] + radius * np.cos(theta)
    y = center[1] + radius * np.sin(theta)

    # Plot the arc
    ax.plot(x, y, color=color, lw=2)

    # Add an arrow at the end of the arc to indicate direction
    arrow_dx = x[-1] - x[-2]
    arrow_dy = y[-1] - y[-2]
    arrow_length = np.sqrt(arrow_dx**2 + arrow_dy**2)

     # Calculate the position to start the arrow so its tip touches the next segment
    arrow_start_x = x[-1] - (arrow_dx/arrow_length) * 0.06
    arrow_start_y = y[-1] - (arrow_dy/arrow_length) * 0.06

    ax.arrow(arrow_start_x, arrow_start_y, arrow_dx, arrow_dy, head_width=0.05, head_length=0.05, fc=color, ec=color)

def plot_dashed_extension(ax, start_point, angle, length, color):
    """Plot a dashed line extension from a given point in a specified direction."""
    end_point = [
        start_point[0] + length * np.cos(angle),
        start_point[1] + length * np.sin(angle)
    ]
    ax.plot([start_point[0], end_point[0]], [start_point[1], end_point[1]], '--', color=color)

# Adjust the starting angle for A-B to be non-zero
angle_A_to_B, label_A_to_B = compute_angle_and_label(triangle_vertices[0], [triangle_vertices[1, 0], triangle_vertices[1, 1]])

# Plot the triangle with adjusted angles and arcs with arrowheads
fig, ax = plt.subplots()
ax.plot(*triangle_vertices[:2].T, 'bo-')  # Only plot edge A-B
ax.plot([triangle_vertices[1, 0], triangle_vertices[2, 0]], [triangle_vertices[1, 1], triangle_vertices[2, 1]], 'bo-')  # Plot edge B-C

# Plot dashed extension segments
plot_dashed_extension(ax, triangle_vertices[0], 0, 0.5, color='gray')  # From A along x-axis
plot_dashed_extension(ax, triangle_vertices[1], angle_A_to_B, 0.5, color='gray')  # Extension from B in direction of A-B

# Label the vertices
for i, txt in enumerate(['A', 'B', 'C']):
    ax.text(triangle_vertices[i, 0] - 0.1, triangle_vertices[i, 1] + 0.05, txt, fontsize=12, fontweight='bold')

# Compute angles and their labels
angle_A_to_B, label_A_to_B = compute_angle_and_label(triangle_vertices[0], triangle_vertices[1])
angle_B_to_C, label_B_to_C = compute_angle_and_label(triangle_vertices[1], triangle_vertices[2])

# Adjust the label positions
label_A_to_B_pos = (triangle_vertices[0, 0] + 0.2, triangle_vertices[0, 1] + 0.03)
label_B_to_C_pos = (triangle_vertices[1, 0] - 0.1, triangle_vertices[0, 1] + 1.3)

# Annotate the angles
ax.annotate(label_A_to_B, label_A_to_B_pos, fontsize=10, color='red')
ax.annotate(label_B_to_C, label_B_to_C_pos, fontsize=10, color='green')

# Plot arcs with arrows for the angles
plot_arc_with_arrow(ax, triangle_vertices[0], 0.5, 0, np.degrees(angle_A_to_B), color='red')
plot_arc_with_arrow(ax, triangle_vertices[1], 0.5, np.degrees(angle_A_to_B), np.degrees(angle_B_to_C), color='green')

# Set dark theme
ax.set_facecolor("#333333")
fig.set_facecolor("#333333")
ax.spines['bottom'].set_color('white')
ax.spines['left'].set_color('white')
ax.spines['right'].set_visible(False)
ax.spines['top'].set_visible(False)
ax.tick_params(axis='x', colors='white')
ax.tick_params(axis='y', colors='white')
ax.xaxis.label.set_color('white')
ax.yaxis.label.set_color('white')
ax.title.set_color('white')

ax.grid(True, color='#555555')
ax.axis('equal')
plt.show()
