import 'highlight.js/styles/github-dark.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import ldb from '../../utils/localdata.js';
import {create} from 'zustand';
import {produce} from 'immer';
import Markdown from 'react-markdown';
import React, {Fragment, useContext, useEffect, useState} from 'react';
import {ChevronDownIcon, ChevronRightIcon} from '@heroicons/react/24/solid';
import {
  CellDependencies,
  CellDependencyValues,
  CellInput,
  CellOutput,
  CellTypes,
  getImagePath,
  Notebook,
  NotebookCell,
  NotebookKernel,
  processWithDependencies,
  unreachable,
} from '@/kernel.tsx';
import Editor from '@monaco-editor/react';
import {
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  CommandLineIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';
import {DebounceUtils} from '@/utils/debounceUtils.ts';
hljs.registerLanguage('javascript', javascript);

export const Home = () => {
  const [notebook, setNotebook] = useState<Notebook | undefined>();
  const [editSchema, setEditSchema] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    ldb.get('notebook', (nb: string) => {
      if (nb) {
        setNotebook(JSON.parse(nb) as Notebook);
      } else {
        setNotebook({
          cells: [],
          metadata: {
            title: 'Untitled Notebook',
          },
          assetLookup: [],
        });
      }
    });
  }, []);

  useEffect(() => {
    if (notebook) {
      // console.log(JSON.stringify(notebook, null, 2));
      DebounceUtils.debounce('notebook', 1000, () => {
        try {
          console.log('Saving notebook');
          const s = JSON.stringify(notebook);
          console.log((s.length / 1024 / 1024).toFixed(5) + ' MB');
          ldb.set('notebook', s);
          // localStorage.setItem('notebook', JSON.stringify(notebook));
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [notebook]);

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

        {/* Notebook area */}

        {notebook && <NotebookViewer notebook={notebook} saveNotebook={setNotebook} />}
      </div>
    </div>
  );
};

const NotebookViewer = ({notebook, saveNotebook}: {notebook: Notebook; saveNotebook: (notebook: Notebook) => void}) => {
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
    kernelRef.current.onSave = (e) => {
      saveNotebook(e);
    };
    setIsLoaded(true);
  }, [notebook]);
  const [editSchema, setEditSchema] = useState(false);
  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-purple-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{notebook?.metadata.title ?? '[Untitled Notebook]'}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditSchema(!editSchema);
            }}
            className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded flex items-center"
          >
            Show schema
          </button>
          <button
            onClick={() => {
              const name = prompt('Enter the name of the new cell');
              if (name) {
                kernelRef.current?.addCell(name);
              }
            }}
            className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded flex items-center"
          >
            Add Cell
          </button>
        </div>
      </header>
      <div className="bg-white rounded-xl shadow-md p-6">
        {editSchema && (
          <div className="mb-6">
            <Editor
              options={{wordWrap: 'on'}}
              height="50vh"
              defaultLanguage="json"
              defaultValue={JSON.stringify(notebook, null, 2)}
              onChange={(e) => {
                DebounceUtils.debounce('editCode', 1000, () => {
                  try {
                    saveNotebook(JSON.parse(e!));
                  } catch (e) {
                    console.error(e);
                  }
                });
              }}
              className="border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
        )}

        {isLoaded && (
          <NotebookKernelContext.Provider value={kernelRef.current}>
            {/*<div className="mt-4 text-sm text-gray-600 grid grid-cols-2 gap-2">
              <p>Total Tokens In: {outputMeta.tokensIn}</p>
              <p>Total Tokens Out: {outputMeta.tokensOut}</p>
              <p>Total Cost In: ${outputMeta.costIn.toFixed(6)}</p>
              <p>Total Cost Out: ${outputMeta.costOut.toFixed(6)}</p>
            </div>*/}
            <div className="flex-1 overflow-auto p-4">
              {notebook.cells.map((cell, index) => (
                <CellContainer
                  key={index}
                  cell={cell}
                  onSave={(e) => {
                    if (!e) {
                      kernelRef.current?.removeCell(cell.input.id);
                    } else {
                      kernelRef.current?.updateCell(e);
                    }
                  }}
                  onMove={(cell, direction) => {
                    kernelRef.current?.moveCell(cell.input.id, direction);
                  }}
                />
              ))}
            </div>
          </NotebookKernelContext.Provider>
        )}
      </div>
    </div>
  );
};

const NotebookKernelContext = React.createContext<NotebookKernel | null>(null);

const CellContainer = ({
  cell,
  onSave,
  onMove,
}: {
  cell: Notebook['cells'][number];
  onSave: (value: NotebookCell | null) => void;
  onMove: (value: NotebookCell, direction: 'up' | 'down') => void;
}) => {
  const kernel = useContext(NotebookKernelContext);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showOutputs, setShowOutputs] = useState(false);
  const [processing, setProcessing] = useState(false);
  return (
    <div className="mb-4 border border-gray-300 rounded-lg overflow-hidden shadow-md">
      <div className="bg-gray-200 p-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-600 hover:text-gray-800">
            {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>
          <span className="font-bold">{cell.input.id}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onMove(cell, 'up')}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onMove(cell, 'down')}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onSave(null)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={async () => {
              setProcessing(true);
              await kernel?.runCell(cell.input.id, true);
              setProcessing(false);
            }}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            {kernel?.cellHasOutput(cell.input.id) ? 'Re-run Cell' : 'Run Cell'}
          </button>
        </div>
      </div>
      {isExpanded && (
        <>
          <CellInputComponent
            processing={processing}
            cellInput={cell.input}
            onSave={(e) => {
              cell.input = e;
              onSave(cell);
            }}
          />
          {cell.outputDetails && (
            <div className="border-t border-gray-300">
              <div className="bg-gray-100 p-2 flex justify-between items-center">
                <span className="font-semibold">Output</span>
                <div className="flex space-x-2">
                  <button onClick={() => setShowOutputs(!showOutputs)} className="text-gray-600 hover:text-gray-800">
                    {showOutputs ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => {
                      const should = confirm('Are you sure you want to clear the outputs?');
                      if (should) {
                        kernel?.clearOutputs(cell.input.id);
                      }
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      const should = confirm('Are you sure you want to download the outputs?');
                      if (should) {
                        kernel?.downloadOutputs(cell.input.id);
                      }
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {showOutputs ? (
                <div className={'p-4'}>
                  {cell.outputDetails &&
                    (cell.outputDetails.hasMultipleOutputs ? (
                      <div className="space-y-4">
                        {cell.outputDetails.outputs.map((output, index) => (
                          <Fragment key={index}>
                            <CellOutputComponent outputIndex={index} output={output} input={cell.input} />
                            <button
                              onClick={async () => {
                                await kernel?.rerunCellOutput(cell.input.id, index, true);
                              }}
                              className="btn btn-primary"
                            >
                              <PlayIcon className="w-5 h-5 mr-2" />
                              Re-run output
                            </button>
                          </Fragment>
                        ))}
                      </div>
                    ) : (
                      <CellOutputComponent output={cell.outputDetails.output} input={cell.input} />
                    ))}
                </div>
              ) : (
                <div className="text-gray-500 p-4">
                  Has{' '}
                  {cell.outputDetails?.hasMultipleOutputs
                    ? cell.outputDetails.outputs.length
                    : cell.outputDetails?.output
                    ? 1
                    : 0}{' '}
                  output(s)
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/*<div className="bg-blue-50 p-2 border-t border-blue-200">
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
          }}
        >
          Edit Dependencies
        </button>
      </div>*/}
    </div>
  );
};

export const CellTypeComponent = ({
  cellType,
  dependencies,
}: {
  cellType: CellTypes | undefined;
  dependencies: CellDependencies | undefined;
}) => {
  const kernel = useContext(NotebookKernelContext);

  const [dependenciesValues, setDependenciesValues] = useState<CellDependencyValues | undefined>(undefined);
  useEffectAsync(async () => {
    if (!kernel) return;
    const result = await kernel.fillDependencies(dependencies, false);
    setDependenciesValues(result[0]);
  }, [dependencies, kernel, kernel?.notebook]);
  const [showPrompt, setShowPrompt] = useState(true);

  if (!cellType) return <>Undefined</>;
  switch (cellType.type) {
    case 'number':
      return <p className="text-lg font-semibold text-gray-700">{cellType.value}</p>;
    case 'image':
      return (
        <img
          src={getImagePath(cellType.content, kernel?.notebook)}
          alt="Input"
          className="max-w-full h-auto rounded-lg shadow-md"
        />
      );
    case 'video':
      return (
        <video
          src={getImagePath(cellType.content, kernel?.notebook)}
          className="max-w-full h-auto rounded-lg shadow-md"
          controls
          muted
          autoPlay
        />
      );
    case 'webpage':
      return <iframe src={cellType.content} className="w-full h-64 border-0 rounded-lg shadow-md" />;
    case 'json':
      return <ObjectViewer object={JSON.parse(cellType.value)} />;
    case 'array':
      return (
        <div className="space-y-4 pl-4">
          {cellType.values.map((value, index) => (
            <CellTypeComponent key={index} cellType={value} dependencies={dependencies} />
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
                      {processWithDependencies(cell, dependenciesValues)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'markdown':
      return (
        <Markdown className="prose max-w-none">
          {processWithDependencies(cellType.content, dependenciesValues)}
        </Markdown>
      );
    case 'code':
      return (
        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
          <code
            className={'theme-github-dark'}
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(cellType.content, {language: 'javascript'}).value,
            }}
          ></code>
        </pre>
      );
    case 'aiPrompt':
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Raw Prompt:</p>
          <Markdown className="prose px-5 max-w-none mb-4">{cellType.prompt}</Markdown>

          <p className="font-semibold mb-1">
            Model: <span className="font-normal">{cellType.model}</span>
          </p>
          <p className="font-semibold mb-1">
            Temperature: <span className="font-normal">{cellType.temperature || 'N/A'}</span>
          </p>
          <p className="font-semibold">
            Schema: <span className="font-normal">{cellType.schema || 'N/A'}</span>
          </p>

          {dependenciesValues && cellType.prompt.includes('{{') && (
            <div
              className={' p-10'}
              onClick={() => {
                setShowPrompt(!showPrompt);
              }}
            >
              <p className="font-semibold mb-2">Prompt:</p>

              {showPrompt && (
                <Markdown className="prose px-5 max-w-none mb-4">
                  {processWithDependencies(cellType.prompt, dependenciesValues)}
                </Markdown>
              )}
            </div>
          )}
        </div>
      );
    case 'aiImagePrompt':
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Image Prompt:</p>
          <Markdown className="prose px-5 max-w-none mb-4">{cellType.prompt}</Markdown>

          <p className="font-semibold mb-1">
            Image Model: <span className="font-normal">{cellType.model}</span>
          </p>

          {dependenciesValues && cellType.prompt.includes('{{') && (
            <div
              className={' p-10'}
              onClick={() => {
                setShowPrompt(!showPrompt);
              }}
            >
              <p className="font-semibold mb-2">Prompt:</p>

              {showPrompt && (
                <Markdown className="prose px-5 max-w-none mb-4">
                  {processWithDependencies(cellType.prompt, dependenciesValues)}
                </Markdown>
              )}
            </div>
          )}
        </div>
      );
    default:
      return <p className="text-red-500">Unsupported input type: {cellType.type}</p>;
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
      case 'video':
        return (
          <input
            type="text"
            value={cellType.content}
            onChange={(e) => onSave({type: 'video', content: e.target.value})}
            className="input input-bordered w-full"
          />
        );
      case 'webpage':
        return <p className="text-gray-500 italic">Not editable</p>;
      case 'json':
        return <ObjectEditor object={cellType.value} onSave={(e) => onSave({type: 'json', value: e})} />;
      case 'array':
        return (
          <div className="space-y-4 pl-4">
            {cellType.values.map((value, index) => (
              <CellTypeComponentEditable
                key={index}
                cellType={value}
                onSave={(e) => {
                  const newValues = [...cellType.values];
                  newValues[index] = e;
                  onSave({...cellType, values: newValues});
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
            onChange={(e) => {
              DebounceUtils.debounce('editCode', 1000, () => {
                onSave({type: cellType.type, content: e || ''});
              });
            }}
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
                onChange={(e) => {
                  DebounceUtils.debounce('editCode', 1000, () => {
                    onSave({...cellType, prompt: e || ''});
                  });
                }}
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
                <option value="">none</option>
                <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                <option value="gpt-4o">gpt-4o</option>
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
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Prompt:</label>
              <Editor
                options={{wordWrap: 'on'}}
                height="20vh"
                defaultLanguage="markdown"
                defaultValue={cellType.prompt}
                onChange={(e) => {
                  DebounceUtils.debounce('editCode', 1000, () => {
                    onSave({...cellType, prompt: e || ''});
                  });
                }}
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
                <option value="">none</option>
                <option value="dall-e-3">dall-e-3</option>
                {/* Add more model options as needed */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resize</label>
              <select
                value={cellType.resize ? `${cellType.resize.width}x${cellType.resize?.height}` : ''}
                onChange={(e) => {
                  const strings = e.target.value.split('x');
                  if (strings.length !== 2) return onSave({...cellType, resize: undefined});
                  return onSave({
                    ...cellType,
                    resize: {
                      width: parseInt(strings[0]),
                      height: parseInt(strings[1]),
                    },
                  });
                }}
                className="select select-bordered w-full"
              >
                <option value="">none</option>
                <option value="128x128">128x128</option>
                <option value="256x256">256x256</option>
                <option value="512x512">512x512</option>
              </select>
            </div>
          </div>
        );
      default:
        return <p className="text-red-500">Unsupported input type: {cellType.type}</p>;
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
            case 'video':
              onSave({
                type: 'video',
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
            case 'array':
              onSave({
                type: 'array',
                values: [],
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
                content: `function run(){
    return 0;
}`,
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
                model: 'dall-e-3',
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
        <option value="video">Video</option>
        <option value="webpage">Webpage</option>
        <option value="json">JSON</option>
        <option value="array">Array</option>
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

function ObjectViewer({object}: {object: Record<string, any>}) {
  const kernel = useContext(NotebookKernelContext);
  const [viewAsJSON, setViewAsJSON] = useState(false);
  const [collapse, setCollapse] = useState(false);
  return (
    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
      <button onClick={() => setViewAsJSON(!viewAsJSON)} className="btn btn-outline btn-primary mb-4">
        {viewAsJSON ? 'View As Table' : 'View As JSON'}
      </button>
      <button onClick={() => setCollapse(!collapse)} className="btn btn-outline btn-primary mb-4">
        {!collapse ? 'Collapse' : 'Expand'}
      </button>
      {viewAsJSON ? (
        <pre>{JSON.stringify(object, null, 2)}</pre>
      ) : (
        !collapse && (
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {Object.entries(object).map(([key, value], index) => (
                <tr key={index}>
                  <td className="py-2 pr-4 font-medium text-gray-900" width={'20%'}>
                    {key}
                  </td>
                  <td className="py-2 pl-4 text-gray-500">
                    {typeof value === 'object' ? (
                      <ObjectViewer object={value} />
                    ) : typeof value === 'string' ? (
                      value.startsWith('asset:') ? (
                        <img src={getImagePath(value, kernel?.notebook)} alt="Image" className="max-w-full h-auto" />
                      ) : value.startsWith('data:') ? (
                        <img src={value} alt="Image" className="max-w-full h-auto" />
                      ) : (
                        <Markdown className={'prose'}>{String(value)}</Markdown>
                      )
                    ) : (
                      String(value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
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
      <button
        onClick={() => {
          const newObj = {...obj};
          newObj[''] = '';
          onSave(JSON.stringify(newObj));
        }}
        className="btn btn-outline btn-primary"
      >
        Add Field
      </button>
    </div>
  );
}

const CellInputComponent = ({
  cellInput,
  processing,
  onSave,
}: {
  processing: boolean;
  cellInput: CellInput;
  onSave: (value: CellInput) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const kernel = useContext(NotebookKernelContext);
  const [editDependencies, setEditDependencies] = useState(false);
  return (
    <>
      <div className="bg-gray-100 p-2 flex justify-between items-center">
        <span className="font-semibold">Input</span>
      </div>
      <div className={clsx('mb-6 p-4', processing && 'bg-yellow-200/50')}>
        {!editDependencies ? (
          <>
            {cellInput.dependencies && Object.keys(cellInput.dependencies).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="font-semibold text-blue-700 mb-2">Dependencies:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(cellInput.dependencies).map(([dependencyKey, dependency], index) => (
                    <li key={index} className="text-blue-600">
                      <strong>{dependencyKey}:</strong> {dependency.cellId} ({dependency.forEach ? 'Iterate' : 'Single'}
                      ) ({dependency.type}) {'field' in dependency && `(${dependency.field})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="font-semibold text-blue-700 mb-2">Dependencies:</p>

            <div className="space-y-2">
              {cellInput.dependencies &&
                Object.entries(cellInput.dependencies).map(([depKey, dependency], index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={depKey}
                      onChange={(e) => {
                        const newDeps = {...cellInput.dependencies};
                        delete newDeps[depKey];
                        newDeps[e.target.value] = {
                          ...dependency,
                          cellId: dependency.cellId,
                        };
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="input input-bordered flex-1"
                    />
                    <select
                      value={dependency.type}
                      onChange={(e) => {
                        const newDeps = {...cellInput.dependencies};
                        switch (e.target.value) {
                          case 'cellReference':
                            newDeps[depKey] = {...dependency, type: 'cellReference'};
                            break;
                          case 'outputReference':
                            newDeps[depKey] = {
                              type: 'outputReference',
                              field: '',
                              cellId: dependency.cellId,
                              forEach: dependency.forEach,
                            };
                            break;
                          default:
                            break;
                        }
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="select select-bordered flex-1"
                    >
                      <option value="cellReference">Cell Reference</option>
                      <option value="outputReference">Output Reference</option>
                    </select>
                    <select
                      value={dependency.cellId}
                      onChange={(e) => {
                        const newDeps = {...cellInput.dependencies};
                        newDeps[depKey] = {...dependency, cellId: e.target.value};
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="select select-bordered flex-1"
                    >
                      {kernel?.buildReferencesAbove(dependency.type, cellInput.id).map((cell) => {
                        return <option value={cell.id}>{cell.id}</option>;
                      })}
                    </select>
                    {dependency.type === 'outputReference' && (
                      <select
                        value={dependency.field}
                        onChange={(e) => {
                          const newDeps = {...cellInput.dependencies};
                          newDeps[depKey] = {...dependency, field: e.target.value};
                          onSave({...cellInput, dependencies: newDeps});
                        }}
                        className="select select-bordered flex-1"
                      >
                        <option value="">Select Field</option>
                        {kernel?.buildFieldsFromOutputReference(dependency.cellId, cellInput.id).map((cell) => {
                          return <option value={cell.id}>{cell.id}</option>;
                        })}
                      </select>
                    )}
                    <label>Iterate</label>
                    <input
                      type={'checkbox'}
                      checked={dependency.forEach}
                      onChange={(e) => {
                        const newDeps = {...cellInput.dependencies};
                        newDeps[depKey] = {...dependency, forEach: e.target.checked};
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="checkbox checkbox-primary"
                    ></input>
                    <button
                      onClick={() => {
                        const newDeps = {...cellInput.dependencies};
                        delete newDeps[depKey];
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="btn btn-outline btn-primary bg-red-500 text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              <button
                onClick={() => {
                  const newDeps = {...cellInput.dependencies};
                  let key = 'newDependency';

                  while (newDeps[key]) {
                    key = key + '1';
                  }

                  newDeps[key] = {cellId: '', forEach: false, type: 'cellReference'};
                  onSave({...cellInput, dependencies: newDeps});
                }}
                className="btn btn-outline btn-primary"
              >
                Add Dependency
              </button>
            </div>
          </div>
        )}

        <button onClick={() => setEditDependencies(!editDependencies)} className="btn btn-outline btn-primary mb-4">
          <PencilIcon className="w-5 h-5 mr-2" />
          Edit Dependencies
        </button>

        {!editing ? (
          <CellTypeComponent cellType={cellInput.input} dependencies={cellInput.dependencies} />
        ) : (
          <div>
            <CellTypeComponentEditable
              cellType={cellInput.input}
              onSave={(e) => {
                cellInput.input = e;
                onSave(cellInput);
              }}
            />
          </div>
        )}
        <div className="mt-4 space-x-2">
          <button onClick={() => setEditing(!editing)} className="btn btn-outline btn-primary">
            <PencilIcon className="w-5 h-5 mr-2" />
            {editing ? 'Finish Editing' : 'Edit'}
          </button>

          {processing && <p className="text-yellow-500">Processing...</p>}
        </div>
      </div>
    </>
  );
};

const CellOutputComponent = ({
  output,
  outputIndex,
  input,
}: {
  output: CellOutput;
  outputIndex?: number;
  input: CellInput;
}) => {
  const [editing, setEditing] = useState(false);

  const [collapseOutputReferences, setCollapseOutputReferences] = useState(true);
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Output {outputIndex}</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        {!editing ? (
          !output.processed ? (
            <p className="text-yellow-500">Output not processed yet</p>
          ) : output.error ? (
            <ErrorDisplay error={output.error} />
          ) : !output.output ? (
            <p className="text-blue-500">No output available</p>
          ) : (
            <>
              <CellTypeComponent cellType={output.output} dependencies={input.dependencies} />
              <button
                onClick={() => setCollapseOutputReferences(!collapseOutputReferences)}
                className="btn btn-outline btn-secondary mt-4"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                {collapseOutputReferences ? 'Show Output References' : 'Hide Output References'}
              </button>
              {!collapseOutputReferences && output.outputReferences && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="font-semibold text-blue-700 mb-2">Output References:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(output.outputReferences).map(([key, value], index) => (
                      <li key={index} className="text-blue-600">
                        <strong>{key}:</strong> {value ? <ObjectViewer object={value} /> : 'No output'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )
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

const useNotebookStore = create((set) => ({
  // bears: 0,
  // increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  // removeAllBears: () => set({ bears: 0 }),
}));

function useEffectAsync(effect: () => Promise<void>, deps: React.DependencyList) {
  React.useEffect(() => {
    effect();
  }, deps);
}
