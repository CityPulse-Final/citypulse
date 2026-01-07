import { Activity, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivityLogEntry } from '../lib/types';
import { ScrollArea } from './ui/scroll-area';

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getEventIcon = (eventType: ActivityLogEntry['eventType']) => {
    switch (eventType) {
      case 'Critical':
        return <AlertCircle className="w-4 h-4 text-[#FF3B3B]" />;
      case 'Elevated':
        return <AlertTriangle className="w-4 h-4 text-[#FFB800]" />;
      case 'Normal':
        return <Info className="w-4 h-4 text-[#00F5FF]" />;
    }
  };

  const getEventColor = (eventType: ActivityLogEntry['eventType']) => {
    switch (eventType) {
      case 'Critical':
        return 'text-[#FF3B3B]';
      case 'Elevated':
        return 'text-[#FFB800]';
      case 'Normal':
        return 'text-[#00F5FF]';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00F5FF]" />
          <h2 className="font-semibold text-white">Activity Feed</h2>
        </div>
        <p className="text-xs text-gray-400 mt-1">Real-time sensor events</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence initial={false}>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index < 5 ? index * 0.05 : 0 }}
                className="p-3 rounded bg-[#0B0E14] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getEventIcon(activity.eventType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-gray-400">
                        {formatTime(activity.timestamp)}
                      </span>
                      <span className={`text-xs font-semibold ${getEventColor(activity.eventType)}`}>
                        {activity.eventType.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-white font-mono">{activity.nodeId}</span>
                      <span className="text-sm font-mono text-gray-300">
                        USI: {activity.value}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}