import Markdown from 'react-markdown';
import React, {useContext, useEffect, useState} from 'react';
import {ChevronDownIcon, ChevronRightIcon} from '@heroicons/react/24/solid';
import {FC} from 'react';
import {
  CellInput,
  CellOutput,
  CellTypes,
  example2,
  Notebook,
  NotebookKernel,
  runKernel,
  unreachable,
} from '@/kernel.tsx';
import Editor from '@monaco-editor/react';
import {PencilIcon, PlayIcon} from '@heroicons/react/20/solid';

export const Home = () => {
  const [notebook, setNotebook] = useState<Notebook | undefined>();
  const [editSchema, setEditSchema] = useState(false);

  useEffect(() => {
    const nb = localStorage.getItem('notebook') ? JSON.parse(localStorage.getItem('notebook')!) : example2();
    setNotebook(nb);
  }, []);

  useEffect(() => {
    if (notebook) {
      localStorage.setItem('notebook', JSON.stringify(notebook));
    }
  }, [notebook]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex space-x-4 mb-6">
        {/*<button
          className="btn btn-primary"
          onClick={async () => {
            if (notebook) await runKernel(notebook);
          }}
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          Run Kernel
        </button>*/}
        <button className="btn btn-secondary" onClick={() => setEditSchema(!editSchema)}>
          <PencilIcon className="w-5 h-5 mr-2" />
          {editSchema ? 'Close Schema Editor' : 'Edit Schema'}
        </button>
      </div>

      {editSchema && (
        <div className="mb-6">
          <Editor
            options={{wordWrap: 'on'}}
            height="50vh"
            defaultLanguage="json"
            defaultValue={JSON.stringify(notebook, null, 2)}
            onChange={(e) => setNotebook(JSON.parse(e!))}
            className="border border-gray-300 rounded-lg shadow-sm"
          />
        </div>
      )}

      {notebook && <NotebookViewer notebook={notebook} />}
    </div>
  );
};

const NotebookViewer = ({notebook}: {notebook: Notebook}) => {
  const outputMeta = notebook.cells.reduce(
    (acc, cell) => {
      if (!cell.outputDetails) {
        return acc;
      }
      const meta = cell.outputDetails.hasMultipleOutputs
        ? cell.outputDetails.outputs.reduce(
            (acc, output) => {
              if (!output.outputMeta) return acc;
              return {
                tokensIn: acc.tokensIn + output.outputMeta.tokensIn,
                tokensOut: acc.tokensOut + output.outputMeta.tokensOut,
                costIn: acc.costIn + output.outputMeta.costIn,
                costOut: acc.costOut + output.outputMeta.costOut,
              };
            },
            {tokensIn: 0, tokensOut: 0, costIn: 0, costOut: 0}
          )
        : cell.outputDetails.output.outputMeta ?? {tokensIn: 0, tokensOut: 0, costIn: 0, costOut: 0};

      return {
        tokensIn: acc.tokensIn + meta.tokensIn,
        tokensOut: acc.tokensOut + meta.tokensOut,
        costIn: acc.costIn + meta.costIn,
        costOut: acc.costOut + meta.costOut,
      };
    },
    {tokensIn: 0, tokensOut: 0, costIn: 0, costOut: 0}
  );

  const kernelRef = React.useRef<NotebookKernel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    kernelRef.current = new NotebookKernel();
    kernelRef.current.loadBook(notebook);
    setIsLoaded(true);
  }, [notebook]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {isLoaded && (
        <NotebookKernelContext.Provider value={kernelRef.current}>
          <NotebookHeader metadata={notebook.metadata} />
          <div className="mt-4 text-sm text-gray-600 grid grid-cols-2 gap-2">
            <p>Total Tokens In: {outputMeta.tokensIn}</p>
            <p>Total Tokens Out: {outputMeta.tokensOut}</p>
            <p>Total Cost In: ${outputMeta.costIn.toFixed(6)}</p>
            <p>Total Cost Out: ${outputMeta.costOut.toFixed(6)}</p>
          </div>
          <div className="space-y-6 mt-6">
            {notebook.cells.map((cell, index) => (
              <CellContainer key={index} cell={cell} onSave={(e) => kernelRef.current?.updateCell(e.id, e)} />
            ))}
          </div>
        </NotebookKernelContext.Provider>
      )}
    </div>
  );
};

/*so you need to add that mobx thing for undo redo, you need to get dependeciy outputs working, and then maybet hats it lol*/

const NotebookKernelContext = React.createContext<NotebookKernel | null>(null);

const NotebookHeader = ({metadata}: {metadata: Notebook['metadata']}) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg mb-6">
      <h1 className="text-3xl font-bold">{metadata.title}</h1>
    </div>
  );
};

const CellContainer = ({cell, onSave}: {cell: Notebook['cells'][number]; onSave: (value: CellInput) => void}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div
        className="flex items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 mr-2 text-gray-500" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 mr-2 text-gray-500" />
        )}
        <span className="font-semibold text-gray-700">Cell {cell.input.id}</span>
      </div>
      {isExpanded && (
        <div className="p-4">
          <CellInputComponent
            input={cell.input}
            onSave={(e) => {
              cell.input = e;
              onSave(e);
            }}
          />
          {cell.outputDetails &&
            (cell.outputDetails.hasMultipleOutputs ? (
              <div className="space-y-4">
                {cell.outputDetails.outputs.map((output, index) => (
                  <CellOutputComponent key={index} output={output} />
                ))}
              </div>
            ) : (
              <CellOutputComponent output={cell.outputDetails.output} />
            ))}
        </div>
      )}
    </div>
  );
};

export const CellTypeComponent = ({cellType}: {cellType: CellTypes}) => {
  switch (cellType.type) {
    case 'number':
      return <p className="text-lg font-semibold text-gray-700">{cellType.value}</p>;
    case 'image':
      return <img src={cellType.content} alt="Input" className="max-w-full h-auto rounded-lg shadow-md" />;
    case 'webpage':
      return <iframe src={cellType.content} className="w-full h-64 border-0 rounded-lg shadow-md" />;
    case 'json':
      return <ObjectViewer object={cellType.value} />;
    case 'jsonArray':
      return (
        <div className="space-y-4">
          {cellType.values.map((value, index) => (
            <ObjectViewer key={index} object={value} />
          ))}
        </div>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <tbody>
              {cellType.cells.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'markdown':
      return <Markdown className="prose max-w-none">{cellType.content}</Markdown>;
    case 'code':
      return (
        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
          <code>{cellType.content}</code>
        </pre>
      );
    case 'aiPrompt':
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Prompt:</p>
          <div className="prose max-w-none mb-4">{cellType.prompt}</div>
          <p className="font-semibold mb-1">
            Model: <span className="font-normal">{cellType.model}</span>
          </p>
          <p className="font-semibold mb-1">
            Temperature: <span className="font-normal">{cellType.temperature || 'N/A'}</span>
          </p>
          <p className="font-semibold">
            Schema: <span className="font-normal">{cellType.schema || 'N/A'}</span>
          </p>
        </div>
      );
    case 'aiImagePrompt':
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Image Prompt:</p>
          <p className="mb-2">{cellType.prompt}</p>
          <p className="font-semibold">
            Model: <span className="font-normal">{cellType.model}</span>
          </p>
        </div>
      );
    default:
      return <p className="text-red-500">Unsupported input type: {(cellType as any).type}</p>;
  }
};

function CellTypeComponentEditable({
  cellType,
  onSave,
}: {
  cellType: CellTypes | undefined;
  onSave: (cellType: CellTypes) => void;
}) {
  const renderCellTypes = () => {
    if (!cellType) return null;

    switch (cellType.type) {
      case 'number':
        return (
          <input
            type="number"
            value={cellType.value}
            onChange={(e) => onSave({type: 'number', value: parseFloat(e.target.value)})}
            className="input input-bordered w-full"
          />
        );
      case 'image':
        return (
          <input
            type="text"
            value={cellType.content}
            onChange={(e) => onSave({type: 'image', content: e.target.value})}
            className="input input-bordered w-full"
          />
        );
      case 'webpage':
        return <p className="text-gray-500 italic">Not editable</p>;
      case 'json':
        return <ObjectEditor object={cellType.value} onSave={(e) => onSave({type: 'json', value: e})} />;
      case 'jsonArray':
        return (
          <div className="space-y-4">
            {cellType.values.map((value, index) => (
              <ObjectEditor
                key={index}
                object={value}
                onSave={(e) => {
                  const newValues = [...cellType.values];
                  newValues[index] = e;
                  onSave({type: 'jsonArray', values: newValues});
                }}
              />
            ))}
          </div>
        );
      case 'table':
        return <p className="text-gray-500 italic">Not editable yet</p>;
      case 'markdown':
      case 'code':
        return (
          <Editor
            options={{wordWrap: 'on'}}
            height="50vh"
            defaultLanguage={cellType.type === 'markdown' ? 'markdown' : 'javascript'}
            defaultValue={cellType.content}
            onChange={(e) => onSave({type: cellType.type, content: e || ''})}
            className="border border-gray-300 rounded-lg"
          />
        );
      case 'aiPrompt':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt:</label>
              <Editor
                options={{wordWrap: 'on'}}
                height="20vh"
                defaultLanguage="markdown"
                defaultValue={cellType.prompt}
                onChange={(e) => onSave({...cellType, prompt: e || ''})}
                className="border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model:</label>
              <select
                value={cellType.model}
                onChange={(e) => onSave({...cellType, model: e.target.value})}
                className="select select-bordered w-full"
              >
                <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                {/* Add more model options as needed */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature:</label>
              <input
                type="number"
                value={cellType.temperature}
                className="input input-bordered w-full"
                step={0.1}
                min={0}
                max={2}
                onChange={(e) => onSave({...cellType, temperature: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schema:</label>
              <input
                type="text"
                value={cellType.schema}
                className="input input-bordered w-full"
                onChange={(e) => onSave({...cellType, schema: e.target.value})}
              />
            </div>
          </div>
        );
      case 'aiImagePrompt':
        return <p className="text-gray-500 italic">Not editable yet</p>;
      default:
        return <p className="text-red-500">Unsupported input type: {(cellType as any).type}</p>;
    }
  };

  return (
    <div className="space-y-4">
      <select
        value={cellType?.type}
        onChange={(e) => {
          const newCellType = e.target.value as CellTypes['type'];

          switch (newCellType) {
            case 'number':
              onSave({
                type: 'number',
                value: 0,
              });
              break;
            case 'image':
              onSave({
                type: 'image',
                content: '',
              });
              break;
            case 'webpage':
              onSave({
                type: 'webpage',
                content: '',
              });
              break;
            case 'json':
              onSave({
                type: 'json',
                value: '{}',
              });
              break;
            case 'jsonArray':
              onSave({
                type: 'jsonArray',
                values: ['{}'],
              });
              break;
            case 'table':
              onSave({
                type: 'table',
                cells: [[]],
              });
              break;
            case 'markdown':
              onSave({
                type: 'markdown',
                content: '',
              });
              break;
            case 'code':
              onSave({
                type: 'code',
                content: '',
              });
              break;
            case 'aiPrompt':
              onSave({
                type: 'aiPrompt',
                prompt: '',
                schema: '',
                systemPrompt: '',
                model: '',
                temperature: 0.5,
              });
              break;
            case 'aiImagePrompt':
              onSave({
                type: 'aiImagePrompt',
                prompt: '',
                model: '',
              });
              break;
            default:
              return unreachable(newCellType);
          }
        }}
        className="select select-bordered w-full"
      >
        <option value="number">Number</option>
        <option value="image">Image</option>
        <option value="webpage">Webpage</option>
        <option value="json">JSON</option>
        <option value="jsonArray">JSON Array</option>
        <option value="table">Table</option>
        <option value="markdown">Markdown</option>
        <option value="code">Code</option>
        <option value="aiPrompt">AI Prompt</option>
        <option value="aiImagePrompt">AI Image Prompt</option>
      </select>
      {renderCellTypes()}
    </div>
  );
}

function ObjectViewer({object}: {object: string}) {
  const obj = JSON.parse(object);
  return (
    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <tbody className="divide-y divide-gray-200">
          {Object.entries(obj).map(([key, value], index) => (
            <tr key={index}>
              <td className="py-2 pr-4 font-medium text-gray-900">{key}</td>
              <td className="py-2 pl-4 text-gray-500">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectEditor({object, onSave}: {object: string; onSave: (value: string) => void}) {
  const obj = JSON.parse(object);
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      {Object.entries(obj).map(([key, value], index) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            value={key}
            onChange={(e) => {
              const newObj = {...obj};
              delete newObj[key];
              newObj[e.target.value] = value;
              onSave(JSON.stringify(newObj));
            }}
            className="input input-bordered flex-1"
          />
          {typeof value === 'string' || typeof value === 'number' ? (
            <input
              type={typeof value === 'number' ? 'number' : 'text'}
              value={value as string | number}
              onChange={(e) => {
                const newObj = {...obj};
                newObj[key] = e.target.value;
                onSave(JSON.stringify(newObj));
              }}
              className="input input-bordered flex-1"
            />
          ) : typeof value === 'object' ? (
            <ObjectEditor
              object={JSON.stringify(value)}
              onSave={(e) => {
                const newObj = {...obj};
                newObj[key] = JSON.parse(e);
                onSave(JSON.stringify(newObj));
              }}
            />
          ) : (
            <span className="text-red-500">Unsupported edit</span>
          )}
        </div>
      ))}
    </div>
  );
}

const CellInputComponent = ({input, onSave}: {input: CellInput; onSave: (value: CellInput) => void}) => {
  const [editing, setEditing] = useState(false);
  const kernel = useContext(NotebookKernelContext);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Input</h3>
      {input.dependencies && Object.keys(input.dependencies).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="font-semibold text-blue-700 mb-2">Dependencies:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(input.dependencies).map(([dep, {cellId, forEach}], index) => (
              <li key={index} className="text-blue-600">
                <strong>{dep}:</strong> {cellId} ({forEach ? 'forEach' : 'single'})
              </li>
            ))}
          </ul>
        </div>
      )}

      {!editing ? (
        <CellTypeComponent cellType={input.input} />
      ) : (
        <CellTypeComponentEditable
          cellType={input.input}
          onSave={(e) => {
            input.input = e;
            onSave(input);
          }}
        />
      )}
      <div className="mt-4 space-x-2">
        <button onClick={() => setEditing(!editing)} className="btn btn-outline btn-primary">
          <PencilIcon className="w-5 h-5 mr-2" />
          {editing ? 'Finish Editing' : 'Edit'}
        </button>
        <button onClick={() => kernel?.runCell(input.id)} className="btn btn-primary">
          <PlayIcon className="w-5 h-5 mr-2" />
          {kernel?.cellHasOutput(input.id) ? 'Re-run Cell' : 'Run Cell'}
        </button>
      </div>
    </div>
  );
};

const CellOutputComponent = ({output}: {output: CellOutput}) => {
  const [editing, setEditing] = useState(false);

  const renderOutput = () => {
    if (!output.processed) {
      return <p className="text-yellow-500">Output not processed yet</p>;
    }

    if (output.error) {
      return <ErrorDisplay error={output.error} />;
    }

    if (!output.output) {
      return <p className="text-blue-500">No output available</p>;
    }

    return <CellTypeComponent cellType={output.output} />;
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Output</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        {!editing ? (
          renderOutput()
        ) : (
          <CellTypeComponentEditable
            cellType={output.output}
            onSave={(e) => {
              output.output = e;
            }}
          />
        )}
      </div>
      <button onClick={() => setEditing(!editing)} className="btn btn-outline btn-secondary mt-4">
        <PencilIcon className="w-5 h-5 mr-2" />
        {editing ? 'Finish Editing' : 'Edit'}
      </button>

      {output.outputMeta && (
        <div className="mt-2 text-sm text-base-content/70">
          <p>Tokens In: {output.outputMeta.tokensIn}</p>
          <p>Tokens Out: {output.outputMeta.tokensOut}</p>
          <p>Cost In: ${output.outputMeta.costIn.toFixed(6)}</p>
          <p>Cost Out: ${output.outputMeta.costOut.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

// ErrorDisplay component
const ErrorDisplay = ({error}: {error: {error: string}}) => {
  return (
    <div className="bg-error text-error-content p-2 rounded">
      <p className="font-semibold">Error:</p>
      <p>{error.error}</p>
    </div>
  );
};
