import React, { useState } from 'react';
import { Ruler, Save, RotateCcw } from 'lucide-react';
import { tamilSizeFields, SizeChart as SizeChartType } from '../types';

const SizeChart: React.FC = () => {
  const [sizes, setSizes] = useState<SizeChartType>(() => {
    const initialSizes: SizeChartType = {};
    tamilSizeFields.forEach(field => {
      initialSizes[field.key] = '';
    });
    return initialSizes;
  });
  
  const [notes, setNotes] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<{[key: string]: SizeChartType & {notes: string}}>({
    'Standard Adult': {
      chest: '36',
      waist: '32',
      hip: '38',
      shoulder: '14',
      armLength: '22',
      armHole: '18',
      neck: '14',
      blouseLength: '16',
      skirtLength: '42',
      kurti: '44',
      pant: '38',
      salwarLength: '40',
      notes: 'Standard measurements for adult women'
    },
    'Petite': {
      chest: '32',
      waist: '28',
      hip: '34',
      shoulder: '12',
      armLength: '20',
      armHole: '16',
      neck: '12',
      blouseLength: '14',
      skirtLength: '38',
      kurti: '40',
      pant: '34',
      salwarLength: '36',
      notes: 'Measurements for petite frame'
    }
  });

  const handleSizeChange = (key: string, value: string) => {
    setSizes(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const templateName = prompt('Enter template name:');
    if (templateName) {
      setSavedTemplates(prev => ({
        ...prev,
        [templateName]: { ...sizes, notes }
      }));
      alert('Template saved successfully!');
    }
  };

  const handleLoadTemplate = (templateName: string) => {
    const template = savedTemplates[templateName];
    if (template) {
      const { notes: templateNotes, ...templateSizes } = template;
      setSizes(templateSizes);
      setNotes(templateNotes);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all measurements?')) {
      const resetSizes: SizeChartType = {};
      tamilSizeFields.forEach(field => {
        resetSizes[field.key] = '';
      });
      setSizes(resetSizes);
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Ruler className="w-8 h-8 text-pink-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Size Chart</h1>
            <p className="text-gray-600">Measurement template in Tamil and English</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Saved Templates */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Saved Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(savedTemplates).map(([name, template]) => (
            <div key={name} className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
              <h3 className="font-medium text-gray-800">{name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.notes}</p>
              <button
                onClick={() => handleLoadTemplate(name)}
                className="mt-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
              >
                Load Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Size Chart Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Measurements</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tamilSizeFields.map(field => (
            <div key={field.key} className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-pink-600 font-semibold">{field.tamil}</span>
                <br />
                <span className="text-gray-500">{field.english}</span>
              </label>
              <input
                type="text"
                value={sizes[field.key] || ''}
                onChange={(e) => handleSizeChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent group-hover:border-pink-300 transition-colors"
                placeholder="Enter size"
              />
            </div>
          ))}
        </div>

        {/* Notes Section */}
        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            rows={4}
            placeholder="Add any special notes about measurements, fitting preferences, or instructions..."
          />
        </div>

        {/* Size Chart Preview */}
        <div className="mt-8 p-4 bg-pink-50 rounded-lg">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Measurements Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
            {tamilSizeFields.map(field => (
              sizes[field.key] && (
                <div key={field.key} className="flex justify-between">
                  <span className="text-gray-600">{field.english}:</span>
                  <span className="font-medium text-gray-800">{sizes[field.key]}</span>
                </div>
              )
            ))}
          </div>
          {notes && (
            <div className="mt-3 pt-3 border-t border-pink-200">
              <p className="text-sm text-gray-700 italic">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Measurement Guidelines:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Take measurements over comfortable fitted clothing</li>
              <li>Keep the tape measure snug but not tight</li>
              <li>Stand naturally with arms at sides</li>
              <li>Record measurements in inches or centimeters consistently</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Tips:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>You can enter letters, numbers, or leave fields empty</li>
              <li>Save commonly used measurements as templates</li>
              <li>Use notes for special fitting requirements</li>
              <li>Double-check critical measurements before saving</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeChart;