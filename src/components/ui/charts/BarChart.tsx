'use client';

import React, { useRef, useEffect, useMemo } from 'react';

interface BarData {
  label: string;
  value: number;
  color?: string;
  tooltip?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  theme?: 'dark' | 'light';
  className?: string;
  barWidth?: number;
  groupSpacing?: number;
}

export function BarChart({
  data,
  height = 300,
  horizontal = false,
  stacked = false,
  showValues = true,
  showGrid = true,
  animate = true,
  title,
  xLabel,
  yLabel,
  theme = 'dark',
  className = '',
  barWidth = 0.7,
  groupSpacing = 0.2
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const colors = useMemo(() => ({
    dark: {
      background: '#111827',
      grid: '#374151',
      text: '#9ca3af',
      tooltip: '#1f2937',
      defaultBar: '#3b82f6'
    },
    light: {
      background: '#ffffff',
      grid: '#e5e7eb',
      text: '#6b7280',
      tooltip: '#f3f4f6',
      defaultBar: '#3b82f6'
    }
  }), []);

  const currentTheme = colors[theme];

  // Generate default colors if not provided
  const defaultColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Calculate bounds
    const padding = { top: 50, right: 30, bottom: 70, left: 70 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(0, ...data.map(d => d.value));
    const valueRange = maxValue - minValue;

    // Animation
    let progress = 0;
    const animationDuration = animate ? 800 : 0;
    const startTime = Date.now();

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = currentTheme.background;
      ctx.fillRect(0, 0, rect.width, height);

      // Save context
      ctx.save();
      ctx.translate(padding.left, padding.top);

      // Calculate animation progress
      if (animate) {
        progress = Math.min((Date.now() - startTime) / animationDuration, 1);
        progress = easeOutElastic(progress);
      } else {
        progress = 1;
      }

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = currentTheme.grid;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);

        if (horizontal) {
          // Vertical grid lines
          for (let i = 0; i <= 5; i++) {
            const x = (chartWidth / 5) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, chartHeight);
            ctx.stroke();
          }
        } else {
          // Horizontal grid lines
          for (let i = 0; i <= 5; i++) {
            const y = (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartWidth, y);
            ctx.stroke();
          }
        }

        ctx.setLineDash([]);
      }

      // Draw axes
      ctx.strokeStyle = currentTheme.text;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, chartHeight);
      ctx.lineTo(chartWidth, chartHeight);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, chartHeight);
      ctx.stroke();

      // Draw axis labels
      ctx.fillStyle = currentTheme.text;
      ctx.font = '12px Inter, system-ui, sans-serif';

      if (horizontal) {
        // X-axis values
        ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
          const value = (maxValue / 5) * i;
          const x = (chartWidth / 5) * i;
          ctx.fillText(value.toFixed(0), x, chartHeight + 20);
        }

        // Y-axis labels
        ctx.textAlign = 'right';
        data.forEach((item, index) => {
          const y = (index + 0.5) * (chartHeight / data.length);
          ctx.fillText(item.label, -10, y + 4);
        });
      } else {
        // Y-axis values
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
          const value = minValue + (valueRange / 5) * (5 - i);
          const y = (chartHeight / 5) * i;
          ctx.fillText(value.toFixed(0), -10, y + 4);
        }

        // X-axis labels
        ctx.textAlign = 'center';
        ctx.save();
        data.forEach((item, index) => {
          const x = (index + 0.5) * (chartWidth / data.length);
          ctx.save();
          ctx.translate(x, chartHeight + 20);
          ctx.rotate(-Math.PI / 4);
          ctx.textAlign = 'right';
          ctx.fillText(item.label, 0, 0);
          ctx.restore();
        });
        ctx.restore();
      }

      // Draw bars
      data.forEach((item, index) => {
        const barColor = item.color || defaultColors[index % defaultColors.length];
        
        if (horizontal) {
          const barHeight = (chartHeight / data.length) * barWidth;
          const y = (index + 0.5) * (chartHeight / data.length) - barHeight / 2;
          const barLength = (item.value / maxValue) * chartWidth * progress;

          // Draw bar
          ctx.fillStyle = barColor;
          ctx.fillRect(0, y, barLength, barHeight);

          // Draw value
          if (showValues && progress === 1) {
            ctx.fillStyle = currentTheme.text;
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.value.toFixed(1), barLength + 5, y + barHeight / 2 + 4);
          }
        } else {
          const barWidth2 = (chartWidth / data.length) * barWidth;
          const x = (index + 0.5) * (chartWidth / data.length) - barWidth2 / 2;
          const normalizedValue = (item.value - minValue) / valueRange;
          const barHeight = normalizedValue * chartHeight * progress;
          const y = chartHeight - barHeight;

          // Draw bar with gradient
          const gradient = ctx.createLinearGradient(0, y, 0, chartHeight);
          gradient.addColorStop(0, barColor);
          gradient.addColorStop(1, barColor + '80');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth2, barHeight);

          // Draw bar top highlight
          ctx.fillStyle = barColor;
          ctx.fillRect(x, y, barWidth2, 2);

          // Draw value
          if (showValues && progress === 1) {
            ctx.fillStyle = currentTheme.text;
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.value.toFixed(1), x + barWidth2 / 2, y - 5);
          }
        }
      });

      // Draw title
      if (title) {
        ctx.fillStyle = currentTheme.text;
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, chartWidth / 2, -25);
      }

      // Draw axis labels
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillStyle = currentTheme.text;
      
      if (xLabel) {
        ctx.textAlign = 'center';
        ctx.fillText(xLabel, chartWidth / 2, chartHeight + 50);
      }

      if (yLabel) {
        ctx.save();
        ctx.translate(-50, chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
      }

      ctx.restore();

      // Continue animation
      if (animate && progress < 1) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    // Mouse interaction for tooltip
    const handleMouseMove = (e: MouseEvent) => {
      if (!tooltipRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - padding.left;
      const y = e.clientY - rect.top - padding.top;

      let hoveredBar: BarData | null = null;

      if (horizontal) {
        const barIndex = Math.floor(y / (chartHeight / data.length));
        if (barIndex >= 0 && barIndex < data.length) {
          const barLength = (data[barIndex].value / maxValue) * chartWidth;
          if (x >= 0 && x <= barLength) {
            hoveredBar = data[barIndex];
          }
        }
      } else {
        const barIndex = Math.floor(x / (chartWidth / data.length));
        if (barIndex >= 0 && barIndex < data.length) {
          const normalizedValue = (data[barIndex].value - minValue) / valueRange;
          const barHeight = normalizedValue * chartHeight;
          const barY = chartHeight - barHeight;
          if (y >= barY && y <= chartHeight) {
            hoveredBar = data[barIndex];
          }
        }
      }

      if (hoveredBar) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = `${e.clientX + 10}px`;
        tooltipRef.current.style.top = `${e.clientY - 30}px`;
        tooltipRef.current.innerHTML = `
          <div style="background: ${currentTheme.tooltip}; padding: 8px; border-radius: 4px; border: 1px solid ${currentTheme.grid};">
            <div style="color: ${hoveredBar.color || currentTheme.defaultBar}; font-weight: 600;">${hoveredBar.label}</div>
            <div style="color: ${currentTheme.text};">Value: ${hoveredBar.value.toFixed(2)}</div>
            ${hoveredBar.tooltip ? `<div style="color: ${currentTheme.text}; font-size: 11px;">${hoveredBar.tooltip}</div>` : ''}
          </div>
        `;
      } else {
        tooltipRef.current.style.display = 'none';
      }
    };

    const handleMouseLeave = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [data, height, horizontal, showValues, showGrid, animate, title, xLabel, yLabel, theme, currentTheme, barWidth]);

  const easeOutElastic = (t: number): number => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none z-10"
        style={{ display: 'none' }}
      />
    </div>
  );
}