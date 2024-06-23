import {
  BeakerIcon,
  SparklesIcon,
  FireIcon,
  CubeTransparentIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  LightBulbIcon,
} from '@heroicons/react/20/solid';
import React, {useCallback, useState} from 'react';
import {
  PlusCircleIcon,
  PlayIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CodeBracketIcon,
  ArrowUpIcon,
  ChevronUpIcon,
  TrashIcon,
  ChevronDownIcon,
  CommandLineIcon,
  ArrowDownTrayIcon,
  EyeSlashIcon,
  EyeIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid';
import Markdown from 'react-markdown';

function Other() {
  const [cells, setCells] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const addCell = (type) => {
    setCells([...cells, {type, input: '', output: '', dependencies: []}]);
  };

  const moveCell = (index, direction) => {
    const newCells = [...cells];
    const cell = newCells[index];
    newCells.splice(index, 1);
    newCells.splice(index + direction, 0, cell);
    setCells(newCells);
  };

  const removeCell = (index) => {
    const newCells = [...cells];
    newCells.splice(index, 1);
    setCells(newCells);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`bg-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            <CommandLineIcon className="h-6 w-6" />
          </button>
        </div>
        {sidebarOpen && (
          <nav className="mt-8">
            <ul>
              <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Notebooks</li>
              <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Files</li>
              <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Settings</li>
            </ul>
          </nav>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Bold Jupyter-like Interface</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => addCell('code')}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded flex items-center"
            >
              <CodeBracketIcon className="h-5 w-5 mr-1" /> Code
            </button>
            <button
              onClick={() => addCell('markdown')}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-1" /> Markdown
            </button>
            <button
              onClick={() => addCell('file')}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded flex items-center"
            >
              <ArrowUpIcon className="h-5 w-5 mr-1" /> File
            </button>
          </div>
        </header>

        {/* Notebook area */}
        <div className="flex-1 overflow-auto p-4">
          {cells.map((cell, index) => (
            <Cell
              key={index}
              cell={cell}
              index={index}
              moveCell={moveCell}
              removeCell={removeCell}
              updateCell={(updatedCell) => {
                const newCells = [...cells];
                newCells[index] = updatedCell;
                setCells(newCells);
              }}
              cells={cells}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({cell, index, moveCell, removeCell, updateCell, cells}) {
  const [isEditing, setIsEditing] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

  const runCell = () => {
    let output = '';
    switch (cell.type) {
      case 'code':
        try {
          // This is a simplified execution. In a real app, you'd want to use a proper code execution engine.
          const dependencies = cell.dependencies.reduce((acc, dep) => {
            const depCell = cells.find((c) => c.id === dep);
            if (depCell) {
              acc[dep] = depCell.output;
            }
            return acc;
          }, {});

          const func = new Function(...Object.keys(dependencies), cell.input);
          output = func(...Object.values(dependencies));
        } catch (error) {
          output = `Error: ${error.message}`;
        }
        break;
      case 'markdown':
        setIsEditing(false);
        output = cell.input;
        break;
      case 'file':
        output = 'File processed';
        break;
    }
    updateCell({...cell, output});
  };

  const renderInput = () => {
    switch (cell.type) {
      case 'code':
        return (
          <textarea
            value={cell.input}
            onChange={(e) => updateCell({...cell, input: e.target.value})}
            className="w-full h-32 p-2 font-mono text-sm bg-gray-800 text-white border border-gray-700 rounded"
            placeholder="Enter your code here..."
          />
        );
      case 'markdown':
        return isEditing ? (
          <textarea
            value={cell.input}
            onChange={(e) => updateCell({...cell, input: e.target.value})}
            className="w-full h-32 p-2 border border-gray-300 rounded"
            placeholder="Enter markdown here..."
          />
        ) : (
          <Markdown className="prose" onClick={() => setIsEditing(true)}>
            {cell.input}
          </Markdown>
        );
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <ArrowUpIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Drag and drop a file here, or click to select a file</p>
            <input type="file" className="hidden" />
          </div>
        );
    }
  };

  const changeType = (newType) => {
    updateCell({...cell, type: newType, input: '', output: ''});
  };

  const clearOutput = () => {
    updateCell({...cell, output: ''});
  };

  const downloadOutput = () => {
    const blob = new Blob([cell.output], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output_cell_${index}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-4 border border-gray-300 rounded-lg overflow-hidden shadow-md">
      <div className="bg-gray-200 p-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <select
            value={cell.type}
            onChange={(e) => changeType(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1"
          >
            <option value="code">Code</option>
            <option value="markdown">Markdown</option>
            <option value="file">File</option>
          </select>
          <span className="font-bold">{cell.type.toUpperCase()} Cell</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => moveCell(index, -1)}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => moveCell(index, 1)}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => removeCell(index)}
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={runCell}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
          >
            <PlayIcon className="h-5 w-5 mr-1" /> Run
          </button>
        </div>
      </div>
      <div className="p-2">{renderInput()}</div>
      {cell.output && (
        <div className="border-t border-gray-300">
          <div className="bg-gray-100 p-2 flex justify-between items-center">
            <span className="font-semibold">Output</span>
            <div className="flex space-x-2">
              <button onClick={() => setShowOutput(!showOutput)} className="text-gray-600 hover:text-gray-800">
                {showOutput ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
              <button onClick={clearOutput} className="text-gray-600 hover:text-gray-800">
                <XCircleIcon className="h-5 w-5" />
              </button>
              <button onClick={downloadOutput} className="text-gray-600 hover:text-gray-800">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          {showOutput && (
            <div className="p-2">
              <EditableJsonViewer
                json={JSON.parse(cell.output)}
                onUpdate={(newOutput) => updateCell({...cell, output: newOutput})}
              />
            </div>
          )}
        </div>
      )}
      <div className="bg-blue-50 p-2 border-t border-blue-200">
        <p className="text-sm font-semibold">Dependencies:</p>
        <ul className="list-disc list-inside">
          {cell.dependencies.map((dep, i) => (
            <li key={i} className="text-sm">
              {dep}
            </li>
          ))}
        </ul>
        <button
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          onClick={() => {
            /* Add logic to edit dependencies */
          }}
        >
          Edit Dependencies
        </button>
      </div>
    </div>
  );
}

export default Other;

function EditableJsonViewer({json, onUpdate}) {
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [editingKey, setEditingKey] = useState(null);

  const toggleExpand = useCallback((key) => {
    setExpandedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const startEditing = useCallback((key) => {
    setEditingKey(key);
  }, []);

  const saveEdit = useCallback(
    (path, newValue) => {
      try {
        const pathArray = path.split('.');
        const newJson = JSON.parse(JSON.stringify(json));
        let current = newJson;
        for (let i = 0; i < pathArray.length - 1; i++) {
          current = current[pathArray[i]];
        }
        current[pathArray[pathArray.length - 1]] = JSON.parse(newValue);
        onUpdate(newJson);
        setEditingKey(null);
      } catch (error) {
        alert('Invalid JSON. Please check your input.');
      }
    },
    [json, onUpdate]
  );

  const renderEditableValue = useCallback(
    (value, key = '', path = '') => {
      const currentPath = path ? `${path}.${key}` : key;
      const isEditing = editingKey === currentPath;

      if (typeof value === 'object' && value !== null) {
        const isArray = Array.isArray(value);
        const brackets = isArray ? ['[', ']'] : ['{', '}'];
        const isExpanded = expandedKeys.has(currentPath);

        return (
          <div className="ml-4">
            <span
              className="cursor-pointer text-blue-600 hover:text-blue-800"
              onClick={() => toggleExpand(currentPath)}
            >
              {isExpanded ? '▼' : '▶'} {key}
            </span>
            {isEditing ? (
              <EditableValue
                value={JSON.stringify(value, null, 2)}
                onSave={(newValue) => saveEdit(currentPath, newValue)}
                onCancel={() => setEditingKey(null)}
              />
            ) : (
              <>
                <button onClick={() => startEditing(currentPath)} className="text-blue-600 hover:text-blue-800 ml-2">
                  Edit
                </button>
                {isExpanded && (
                  <div className="ml-4">
                    {Object.entries(value).map(([k, v]) => (
                      <div key={k}>{renderEditableValue(v, k, currentPath)}</div>
                    ))}
                  </div>
                )}
                {!isExpanded && (
                  <span>
                    {brackets[0]}...{brackets[1]}
                  </span>
                )}
              </>
            )}
          </div>
        );
      } else {
        return (
          <div className="ml-4 flex items-center">
            <span className="text-gray-600">{key}: </span>
            {isEditing ? (
              <EditableValue
                value={JSON.stringify(value)}
                onSave={(newValue) => saveEdit(currentPath, newValue)}
                onCancel={() => setEditingKey(null)}
              />
            ) : (
              <>
                <span className={`${typeof value === 'string' ? 'text-green-600' : 'text-purple-600'} mr-2`}>
                  {JSON.stringify(value)}
                </span>
                <button onClick={() => startEditing(currentPath)} className="text-blue-600 hover:text-blue-800">
                  Edit
                </button>
              </>
            )}
          </div>
        );
      }
    },
    [expandedKeys, editingKey, toggleExpand, startEditing, saveEdit]
  );

  return <div className="font-mono text-sm">{renderEditableValue(json)}</div>;
}

function EditableValue({value, onSave, onCancel}) {
  const [editValue, setEditValue] = useState(value);

  return (
    <>
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 mr-2 w-full"
        rows={editValue.split('\n').length}
      />
      <button
        onClick={() => onSave(editValue)}
        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
      >
        Save
      </button>
      <button onClick={onCancel} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2">
        Cancel
      </button>
    </>
  );
}

function BoldJupyterInterface() {
  const [theme, setTheme] = useState('dark');
  const [cells, setCells] = useState([]);

  const addCell = (type) => {
    setCells([...cells, {type, content: '', output: ''}]);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <button
          onClick={() => addCell('code')}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-all duration-300"
        >
          <BeakerIcon className="h-8 w-8" />
        </button>
        <button
          onClick={() => addCell('markdown')}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-all duration-300"
        >
          <SparklesIcon className="h-8 w-8" />
        </button>
        <button
          onClick={() => addCell('visualization')}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-all duration-300"
        >
          <CubeTransparentIcon className="h-8 w-8" />
        </button>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-6 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-green-300 to-blue-500">
            Cosmic Jupyter
          </span>
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={toggleTheme}
            className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-300"
          >
            {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </button>
          <button className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-300">
            <GlobeAltIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto mt-8 px-4">
        {cells.map((cell, index) => (
          <CellComponent key={index} cell={cell} />
        ))}
      </main>
    </div>
  );
}

function CellComponent({cell}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`mb-8 ${isExpanded ? 'scale-100' : 'scale-95'} transition-all duration-300`}>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-lg shadow-lg">
        <div className={`${isExpanded ? 'bg-gray-800' : 'bg-gray-900'} rounded-lg p-4`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <span className={`text-${getCellColor(cell.type)}-400 font-semibold`}>{cell.type.toUpperCase()}</span>
              {getCellIcon(cell.type)}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {isExpanded && (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                {/* Cell content would go here */}
                <p>Cell content placeholder</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Output</h3>
                {/* Cell output would go here */}
                <p>Cell output placeholder</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getCellColor(type) {
  switch (type) {
    case 'code':
      return 'blue';
    case 'markdown':
      return 'green';
    case 'visualization':
      return 'yellow';
    default:
      return 'gray';
  }
}

function getCellIcon(type) {
  switch (type) {
    case 'code':
      return <LightBulbIcon className="h-5 w-5 text-blue-400" />;
    case 'markdown':
      return <SparklesIcon className="h-5 w-5 text-green-400" />;
    case 'visualization':
      return <FireIcon className="h-5 w-5 text-yellow-400" />;
    default:
      return null;
  }
}
