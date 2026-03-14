// src/components/progress/ProgressDataContent.jsx
import React from 'react';
import { Activity, Award, BarChart2, Scale, Ruler, Percent } from 'lucide-react';

const ProgressDataContent = ({ data }) => {
  if (!data) return null;
  
  // Helper to format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Common section - Stats
  const renderStats = () => {
    const stats = data.stats;
    if (!stats) return null;
    
    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Stats</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-gray-700">Total Workouts: <span className="font-medium">{stats.totalWorkouts}</span></div>
          <div className="text-gray-700">Avg Duration: <span className="font-medium">{formatTime(stats.avgDuration)}</span></div>
          <div className="text-gray-700">Completion Rate: <span className="font-medium">{stats.completionRate.toFixed(1)}%</span></div>
          <div className="text-gray-700">Top Exercise: <span className="font-medium">{stats.mostFrequentExercise}</span></div>
        </div>
      </div>
    );
  };
  
  if (data.tab === 'overview') {
    return (
      <div>
        {renderStats()}
        
        {data.muscleGroupData && data.muscleGroupData.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Top Muscle Groups</h4>
            <div className="space-y-2">
              {data.muscleGroupData.slice(0, 3).map((group, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">{group.name}</span>
                  <span className="text-gray-700">{group.count} exercises</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.weeklyWorkouts && data.weeklyWorkouts.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Weekly Frequency</h4>
            <div className="space-y-1">
              {data.weeklyWorkouts.map((week, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">{week.week}</span>
                  <span className="text-gray-700">{week.count} workouts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (data.tab === 'exercises' && data.selectedExercise) {
    return (
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Exercise Progress: {data.selectedExercise}</h4>
        {data.exerciseProgressData && data.exerciseProgressData.length > 0 ? (
          <div className="space-y-2">
            {data.exerciseProgressData.slice(-3).map((entry, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-700">{entry.date}</span>
                <span className="text-gray-700">{entry.weight} lbs</span>
              </div>
            ))}
            <div className="text-gray-700 text-xs italic mt-1">
              Showing last 3 of {data.exerciseProgressData.length} entries
            </div>
          </div>
        ) : (
          <div className="text-gray-700">No progress data available</div>
        )}
      </div>
    );
  }
  
  if (data.tab === 'records') {
    return (
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Top Personal Records</h4>
        {data.personalRecords && data.personalRecords.length > 0 ? (
          <div className="space-y-2">
            {data.personalRecords.slice(0, 3).map((record, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-700">{record.exercise}</span>
                <span className="text-gray-700">{record.weight} lbs × {record.reps}</span>
              </div>
            ))}
            <div className="text-gray-700 text-xs italic mt-1">
              Showing top 3 of {data.personalRecords.length} records
            </div>
          </div>
        ) : (
          <div className="text-gray-700">No personal records available</div>
        )}
      </div>
    );
  }
  
  if (data.tab === 'bodyComp') {
    return (
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Body Composition</h4>
        <div className="space-y-3">
          {data.weightHistory && data.weightHistory.length > 0 && (
            <div>
              <div className="text-gray-700">Current Weight: {data.weightHistory[data.weightHistory.length - 1].value} {data.weightHistory[data.weightHistory.length - 1].unit}</div>
              <div className="text-gray-700 text-xs">From {data.weightHistory.length} measurements</div>
            </div>
          )}
          
          {data.bodyFatHistory && data.bodyFatHistory.length > 0 && (
            <div>
              <div className="text-gray-700">Current Body Fat: {data.bodyFatHistory[data.bodyFatHistory.length - 1].value}%</div>
              <div className="text-gray-700 text-xs">From {data.bodyFatHistory.length} measurements</div>
            </div>
          )}
          
          {data.bodyMeasurements && Object.keys(data.bodyMeasurements).some(key => data.bodyMeasurements[key]) && (
            <div>
              <div className="text-gray-700">Key Measurements:</div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {Object.entries(data.bodyMeasurements)
                  .filter(([_, value]) => value)
                  .map(([key, value]) => (
                    <div key={key} className="text-gray-700 text-sm capitalize">
                      {key}: {value} cm
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return <div className="text-gray-700">Progress data shared</div>;
};

export default ProgressDataContent;