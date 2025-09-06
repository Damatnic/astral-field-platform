import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'trend' | 'comparison' | 'prediction';
  title: string;
  config: Record<string, any>;
  dataSource: string;
  position: { x: number; y: number; w: number; h: number };
  filters: Record<string, any>;
  refreshInterval?: number;
}

interface Dashboard {
  id?: string;
  name: string;
  description?: string;
  layout: 'grid' | 'freeform' | 'responsive';
  widgets: Widget[];
  theme: 'dark' | 'light' | 'auto';
  isPublic: boolean;
  tags: string[];
}

interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'realtime';
  endpoint?: string;
  schema: Record<string, string>;
  refreshRate: number;
  lastUpdated: string;
}

interface WidgetTemplate {
  id: string;
  type: Widget['type'];
  name: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, any>;
  requiredFields: string[];
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'player_performance_chart',
    type: 'chart',
    name: 'Player Performance',
    description: 'Track individual player statistics over time',
    icon: '📈',
    defaultConfig: { chartType: 'line', timeRange: '30d' },
    requiredFields: ['playerId', 'metrics']
  },
  {
    id: 'team_comparison',
    type: 'comparison',
    name: 'Team Comparison',
    description: 'Compare multiple teams across key metrics',
    icon: '⚖️',
    defaultConfig: { comparisonType: 'radar', maxTeams: 4 },
    requiredFields: ['teamIds', 'metrics']
  },
  {
    id: 'injury_heatmap',
    type: 'heatmap',
    name: 'Injury Risk Heatmap',
    description: 'Visualize injury risk across positions and teams',
    icon: '🩹',
    defaultConfig: { riskLevels: 5, showPredictions: true },
    requiredFields: ['position', 'week']
  },
  {
    id: 'waiver_predictions',
    type: 'prediction',
    name: 'Waiver Wire Predictions',
    description: 'AI-powered waiver wire recommendations',
    icon: '🔮',
    defaultConfig: { modelType: 'ensemble', confidenceThreshold: 0.7 },
    requiredFields: ['position', 'availability']
  },
  {
    id: 'trade_analyzer',
    type: 'table',
    name: 'Trade Analysis',
    description: 'Detailed trade scenario analysis',
    icon: '🔄',
    defaultConfig: { showProjections: true, includeRisk: true },
    requiredFields: ['playerIds', 'tradeType']
  },
  {
    id: 'lineup_optimizer',
    type: 'metric',
    name: 'Lineup Score',
    description: 'Current lineup optimization score',
    icon: '⚡',
    defaultConfig: { includeProjections: true, riskTolerance: 'medium' },
    requiredFields: ['lineupId']
  }
];

const CustomDashboardBuilder: React.FC<{ dashboardId?: string }> = ({ dashboardId }) => {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard>({
    name: 'My Dashboard',
    description: '',
    layout: 'grid',
    widgets: [],
    theme: 'dark',
    isPublic: false,
    tags: []
  });
  
  const [availableDataSources, setAvailableDataSources] = useState<DataSource[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDataSources();
    if (dashboardId) {
      loadDashboard(dashboardId);
    }
  }, [dashboardId]);

  const loadDataSources = async () => {
    try {
      const response = await fetch('/api/analytics/data-sources');
      const data = await response.json();
      if (response.ok) {
        setAvailableDataSources(data.dataSources || []);
      }
    } catch (error) {
      console.error('Failed to load data sources:', error);
    }
  };

  const loadDashboard = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboards/${id}`);
      const data = await response.json();
      if (response.ok) {
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDashboard = async () => {
    try {
      setSaving(true);
      const url = dashboardId 
        ? `/api/analytics/dashboards/${dashboardId}`
        : '/api/analytics/dashboards';
      
      const response = await fetch(url, {
        method: dashboardId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard)
      });

      const data = await response.json();
      if (response.ok) {
        if (!dashboardId) {
          router.push(`/analytics/dashboard/builder/${data.dashboard.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    } finally {
      setSaving(false);
    }
  };

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: Widget = {
      id: `widget_${Date.now()}`,
      type: template.type,
      title: template.name,
      config: { ...template.defaultConfig },
      dataSource: '',
      position: {
        x: 0,
        y: dashboard.widgets.length * 2,
        w: template.type === 'metric' ? 3 : 6,
        h: template.type === 'metric' ? 2 : 4
      },
      filters: {}
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
    
    setSelectedWidget(newWidget);
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      )
    }));
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeWidget = (widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }));
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(dashboard.widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDashboard(prev => ({ ...prev, widgets: items }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/analytics')}
                className="text-gray-400 hover:text-white"
              >
                ← Back
              </Button>
              
              <div>
                <Input
                  value={dashboard.name}
                  onChange={(e) => setDashboard(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-bold bg-transparent border-none focus:ring-0 text-white"
                  placeholder="Dashboard Name"
                />
                <p className="text-sm text-gray-400 mt-1">
                  {dashboard.widgets.length} widgets • {dashboard.layout} layout
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant={previewMode ? "secondary" : "ghost"}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? '✏️ Edit' : '👁️ Preview'}
              </Button>
              
              <Button
                variant="primary"
                onClick={saveDashboard}
                loading={saving}
              >
                💾 Save Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {previewMode ? (
          <DashboardPreview dashboard={dashboard} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Widget Library */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Library</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {WIDGET_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => addWidget(template)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Dashboard Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Layout
                    </label>
                    <select
                      value={dashboard.layout}
                      onChange={(e) => setDashboard(prev => ({ 
                        ...prev, 
                        layout: e.target.value as Dashboard['layout']
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="grid">Grid Layout</option>
                      <option value="freeform">Freeform Layout</option>
                      <option value="responsive">Responsive Layout</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={dashboard.theme}
                      onChange={(e) => setDashboard(prev => ({ 
                        ...prev, 
                        theme: e.target.value as Dashboard['theme']
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dashboard.isPublic}
                        onChange={(e) => setDashboard(prev => ({ 
                          ...prev, 
                          isPublic: e.target.checked
                        }))}
                        className="rounded border-gray-600 bg-gray-700"
                      />
                      <span className="text-sm text-gray-300">Make Public</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Canvas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Canvas</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.widgets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-300 mb-2">
                        Start Building Your Dashboard
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Add widgets from the library to get started
                      </p>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="dashboard">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                          >
                            {dashboard.widgets.map((widget, index) => (
                              <Draggable
                                key={widget.id}
                                draggableId={widget.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      'border border-gray-600 rounded-lg p-4 bg-gray-800',
                                      snapshot.isDragging && 'shadow-lg',
                                      selectedWidget?.id === widget.id && 'border-blue-400'
                                    )}
                                    onClick={() => setSelectedWidget(widget)}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="flex items-center space-x-2"
                                      >
                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                        <h4 className="font-medium">{widget.title}</h4>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                          e.stopPropagation();
                                          removeWidget(widget.id);
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        🗑️
                                      </Button>
                                    </div>
                                    <div className="bg-gray-700 rounded p-6 text-center">
                                      <div className="text-3xl mb-2">
                                        {WIDGET_TEMPLATES.find(t => t.type === widget.type)?.icon}
                                      </div>
                                      <p className="text-gray-400 text-sm">
                                        {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Widget Configuration */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedWidget ? (
                    <WidgetConfigPanel
                      widget={selectedWidget}
                      dataSources={availableDataSources}
                      onUpdate={(updates) => updateWidget(selectedWidget.id, updates)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">⚙️</div>
                      <p className="text-gray-400">
                        Select a widget to configure its settings
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WidgetConfigPanel: React.FC<{
  widget: Widget;
  dataSources: DataSource[];
  onUpdate: (updates: Partial<Widget>) => void;
}> = ({ widget, dataSources, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Widget Title
        </label>
        <Input
          value={widget.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Data Source
        </label>
        <select
          value={widget.dataSource}
          onChange={(e) => onUpdate({ dataSource: e.target.value })}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="">Select Data Source</option>
          {dataSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Width
          </label>
          <Input
            type="number"
            value={widget.position.w}
            onChange={(e) => onUpdate({ 
              position: { ...widget.position, w: parseInt(e.target.value) || 1 }
            })}
            min="1"
            max="12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Height
          </label>
          <Input
            type="number"
            value={widget.position.h}
            onChange={(e) => onUpdate({ 
              position: { ...widget.position, h: parseInt(e.target.value) || 1 }
            })}
            min="1"
            max="12"
          />
        </div>
      </div>

      {widget.type === 'chart' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chart Type
          </label>
          <select
            value={widget.config.chartType || 'line'}
            onChange={(e) => onUpdate({ 
              config: { ...widget.config, chartType: e.target.value }
            })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>
      )}
    </div>
  );
};

const DashboardPreview: React.FC<{ dashboard: Dashboard }> = ({ dashboard }) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">{dashboard.name}</h2>
        <p className="text-gray-400">Dashboard Preview Mode</p>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {dashboard.widgets.map((widget) => (
          <div
            key={widget.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-4"
            style={{
              gridColumn: `span ${widget.position.w}`,
              minHeight: `${widget.position.h * 80}px`
            }}
          >
            <h3 className="font-medium mb-3">{widget.title}</h3>
            <div className="bg-gray-700 rounded h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {WIDGET_TEMPLATES.find(t => t.type === widget.type)?.icon}
                </div>
                <p className="text-gray-400 text-sm">Preview Data</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomDashboardBuilder;