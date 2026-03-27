import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Renders the authentic Google "G" logo using CustomPainter.
class GoogleLogo extends StatelessWidget {
  final double size;
  const GoogleLogo({super.key, this.size = 24});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final cy = h / 2;
    final radius = w * 0.44;
    final strokeWidth = w * 0.155;
    final halfStroke = strokeWidth / 2;

    // Colours
    const blue = Color(0xFF4285F4);
    const red = Color(0xFFEA4335);
    const yellow = Color(0xFFFBBC05);
    const green = Color(0xFF34A853);

    Paint arcPaint(Color color) => Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final arcRect = Rect.fromCircle(center: Offset(cx, cy), radius: radius);

    // Google G arc layout (angles from 0 = right, going clockwise)
    // Blue:   -10° → 92°   (top-right, right, bottom-right)
    canvas.drawArc(arcRect, _rad(-10), _rad(102), false, arcPaint(blue));
    // Green:  92°  → 135°
    canvas.drawArc(arcRect, _rad(92), _rad(43), false, arcPaint(green));
    // Yellow: 135° → 225°
    canvas.drawArc(arcRect, _rad(135), _rad(90), false, arcPaint(yellow));
    // Red:    225° → 350°
    canvas.drawArc(arcRect, _rad(225), _rad(125), false, arcPaint(red));

    // ── Horizontal "G" bar (blue filled rectangle) ──────────────────────
    final barPaint = Paint()
      ..color = blue
      ..style = PaintingStyle.fill;

    // The bar starts at the centre x, sits at the middle y
    final barLeft = cx - halfStroke; // start just before centre for cleaner join
    final barRight = cx + radius + halfStroke;
    final barTop = cy - strokeWidth * 0.36;
    final barBottom = cy + strokeWidth * 0.36;

    canvas.drawRect(
      Rect.fromLTRB(barLeft, barTop, barRight, barBottom),
      barPaint,
    );
  }

  double _rad(double deg) => deg * math.pi / 180;

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
