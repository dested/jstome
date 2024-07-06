Steps to implement the feature:

1. Update the overall layout to resemble VS Code's interface
2. Modify the sidebar to look more like VS Code's sidebar
3. Update the main content area styling
4. Adjust the notebook cell styling to match VS Code's aesthetics
5. Modify buttons and icons to align with VS Code's design
6. Update color scheme to match VS Code's default dark theme
7. Adjust typography to match VS Code's font styles
8. Refine the cell input and output components to have a more VS Code-like appearance

Now, I'll implement these changes:

File Path: src/pages/Home/home.tsx
```
import 'highlight.js/styles/github-dark.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import ldb from '../../utils/localdata.js';
import {create} from 'zustand';
import {produce} from 'immer';
import Markdown from 'react-markdown';
import React, {Fragment, useCallback, useContext, useEffect, useState} from 'react';
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
  ChevronUpIcon,
  CommandLineIcon,
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
      DebounceUtils.debounce('notebook', 1000, () => {
        try {
          console.log('Saving notebook');
          const s = JSON.stringify(notebook);
          console.log((s.length / 1024 / 1024).toFixed(5) + ' MB');
          ldb.set('notebook', s);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [notebook]);

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4]">
      <div className={`bg-[#252526] transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#cccccc] hover:text-white">
            <CommandLineIcon className="h-6 w-6" />
          </button>
        </div>
        {sidebarOpen && (
          <nav className="mt-8">
            <ul>
              <li className="px-4 py-2 hover:bg-[#37373d] cursor-pointer">Notebooks</li>
              <li className="px-4 py-2 hover:bg-[#37373d] cursor-pointer">Files</li>
              <li className="px-4 py-2 hover:bg-[#37373d] cursor-pointer">Settings</li>
            </ul>
          </nav>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
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
  }, [notebook, saveNotebook]);

  const [editSchema, setEditSchema] = useState(false);
  return (
    <div className="flex-1 overflow-auto bg-[#1e1e1e]">
      <header className="bg-[#3c3c3c] text-[#cccccc] p-4 flex justify-between items-center">
        <h1 className="text-2xl font-normal">{notebook?.metadata.title ?? '[Untitled Notebook]'}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditSchema(!editSchema);
            }}
            className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded flex items-center"
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
            className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded flex items-center"
          >
            Add Cell
          </button>
        </div>
      </header>
      <div className="p-6">
        {editSchema && (
          <div className="mb-6">
            <Editor
              options={{wordWrap: 'on', theme: 'vs-dark'}}
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
              className="border border-[#3c3c3c] rounded-lg shadow-sm"
            />
          </div>
        )}

        {isLoaded && (
          <NotebookKernelContext.Provider value={kernelRef.current}>
            <div className="space-y-4">
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
    <div className="border border-[#3c3c3c] rounded-lg overflow-hidden shadow-md">
      <div className="bg-[#2d2d2d] p-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-[#cccccc] hover:text-white">
            {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>
          <span className="font-normal">{cell.input.id}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onMove(cell, 'up')}
            className="bg-[#3c3c3c] text-[#cccccc] px-2 py-1 rounded hover:bg-[#505050]"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onMove(cell, 'down')}
            className="bg-[#3c3c3c] text-[#cccccc] px-2 py-1 rounded hover:bg-[#505050]"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onSave(null)} className="bg-[#3c3c3c] text-[#cccccc] px-2 py-1 rounded hover:bg-[#505050]">
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            onClick={async () => {
              setProcessing(true);
              await kernel?.runCell(cell.input.id, true);
              setProcessing(false);
            }}
            className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded flex items-center"
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
            <div className="border-t border-[#3c3c3c]">
              <div className="bg-[#2d2d2d] p-2 flex justify-between items-center">
                <span className="font-normal">Output</span>
                <div className="flex space-x-2">
                  <button onClick={() => setShowOutputs(!showOutputs)} className="text-[#cccccc] hover:text-white">
                    {showOutputs ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={() => {
                      const should = confirm('Are you sure you want to clear the outputs?');
                      if (should) {
                        kernel?.clearOutputs(cell.input.id);
                      }
                    }}
                    className="text-[#cccccc] hover:text-white"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      const should = confirm('Are you sure you want to download the outputs?');
                      if (should) {
                        kernel?.downloadOutputs(cell.input.id);
                      }
                    }}
                    className="text-[#cccccc] hover:text-white"
                  >
                    <ArrowDownTrayIcon className="h-6 w-6" />
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
                              className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded"
                            >
                              <PlayIcon className="w-5 h-5 mr-2 inline" />
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
                <div className="text-[#cccccc] p-4">
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
}) => {
}) => {Certainly, I'll continue with the modifications:

File Path: src/pages/Home/home.tsx
```
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
      return <p className="text-lg font-normal text-[#d4d4d4]">{cellType.value}</p>;
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
      return <JsonViewer json={JSON.parse(cellType.value)} />;
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
          <table className="w-full">
            <tbody>
              {cellType.cells.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-[#2d2d2d]' : 'bg-[#1e1e1e]'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-[#3c3c3c] px-4 py-2">
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
        <Markdown className="prose prose-invert max-w-none">
          {processWithDependencies(cellType.content, dependenciesValues)}
        </Markdown>
      );
    case 'code':
      return (
        <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto">
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
        <div className="bg-[#2d2d2d] p-4 rounded-lg">
          <p className="font-normal mb-2">Raw Prompt:</p>
          <Markdown className="prose prose-invert px-5 max-w-none mb-4">{cellType.prompt}</Markdown>

          <p className="font-normal mb-1">
            Model: <span className="font-light">{cellType.model}</span>
          </p>
          <p className="font-normal mb-1">
            Temperature: <span className="font-light">{cellType.temperature || 'N/A'}</span>
          </p>
          <p className="font-normal">
            Schema: <span className="font-light">{cellType.schema || 'N/A'}</span>
          </p>

          {dependenciesValues && cellType.prompt.includes('{{') && (
            <div
              className={'p-10'}
              onClick={() => {
                setShowPrompt(!showPrompt);
              }}
            >
              <p className="font-normal mb-2">Prompt:</p>

              {showPrompt && (
                <Markdown className="prose prose-invert px-5 max-w-none mb-4">
                  {processWithDependencies(cellType.prompt, dependenciesValues)}
                </Markdown>
              )}
            </div>
          )}
        </div>
      );
    case 'aiImagePrompt':
      return (
        <div className="bg-[#2d2d2d] p-4 rounded-lg">
          <p className="font-normal mb-2">Image Prompt:</p>
          <Markdown className="prose prose-invert px-5 max-w-none mb-4">{cellType.prompt}</Markdown>

          <p className="font-normal mb-1">
            Image Model: <span className="font-light">{cellType.model}</span>
          </p>

          {dependenciesValues && cellType.prompt.includes('{{') && (
            <div
              className={'p-10'}
              onClick={() => {
                setShowPrompt(!showPrompt);
              }}
            >
              <p className="font-normal mb-2">Prompt:</p>

              {showPrompt && (
                <Markdown className="prose prose-invert px-5 max-w-none mb-4">
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
            className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
          />
        );
      case 'image':
        return (
          <input
            type="text"
            value={cellType.content}
            onChange={(e) => onSave({type: 'image', content: e.target.value})}
            className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
          />
        );
      case 'video':
        return (
          <input
            type="text"
            value={cellType.content}
            onChange={(e) => onSave({type: 'video', content: e.target.value})}
            className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
          />
        );
      case 'webpage':
        return <p className="text-[#cccccc] italic">Not editable</p>;
      case 'json':
        return (
          <EditableJsonViewer
            json={JSON.parse(cellType.value)}
            onUpdate={(e) => onSave({type: 'json', value: JSON.stringify(e)})}
          />
        );
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
        return <p className="text-[#cccccc] italic">Not editable yet</p>;
      case 'markdown':
      case 'code':
        return (
          <Editor
            options={{wordWrap: 'on', theme: 'vs-dark'}}
            height="50vh"
            defaultLanguage={cellType.type === 'markdown' ? 'markdown' : 'javascript'}
            defaultValue={cellType.content}
            onChange={(e) => {
              DebounceUtils.debounce('editCode', 1000, () => {
                onSave({type: cellType.type, content: e || ''});
              });
            }}
            className="border border-[#3c3c3c] rounded-lg"
          />
        );
      case 'aiPrompt':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Prompt:</label>
              <Editor
                options={{wordWrap: 'on', theme: 'vs-dark'}}
                height="20vh"
                defaultLanguage="markdown"
                defaultValue={cellType.prompt}
                onChange={(e) => {
                  DebounceUtils.debounce('editCode', 1000, () => {
                    onSave({...cellType, prompt: e || ''});
                  });
                }}
                className="border border-[#3c3c3c] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Model:</label>
              <select
                value={cellType.model}
                onChange={(e) => onSave({...cellType, model: e.target.value})}
                className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
              >
                <option value="">none</option>
                <option value="claude-3-5-sonnet-20240620">claude-3-5-sonnet-20240620</option>
                <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Temperature:</label>
              <input
                type="number"
                value={cellType.temperature}
                className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
                step={0.1}
                min={0}
                max={2}
                onChange={(e) => onSave({...cellType, temperature: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Schema:</label>
              <input
                type="text"
                value={cellType.schema}
                className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
                onChange={(e) => onSave({...cellType, schema: e.target.value})}
              />
            </div>
          </div>
        );
      case 'aiImagePrompt':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Image Prompt:</label>
              <Editor
                options={{wordWrap: 'on', theme: 'vs-dark'}}
                height="20vh"
                defaultLanguage="markdown"
                defaultValue={cellType.prompt}
                onChange={(e) => {
                  DebounceUtils.debounce('editCode', 1000, () => {
                    onSave({...cellType, prompt: e || ''});
                  });
                }}
                className="border border-[#3c3c3c] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Model:</label>
              <select
                value={cellType.model}
                onChange={(e) => onSave({...cellType, model: e.target.value})}
                className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
              >
                <option value="">none</option>
                <option value="dall-e-3">dall-e-3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-normal text-[#d4d4d4] mb-1">Resize</label>
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
                className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
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
                type: 'webpage 'webpage 'webpageCertainly, I'll continue with the modifications:

File Path: src/pages/Home/home.tsx
```
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
        className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 w-full"
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
      <div key={cellType?.type} className="space-y-4">
        {renderCellTypes()}
      </div>
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
      <div className="bg-[#2d2d2d] p-2 flex justify-between items-center">
        <span className="font-normal">Input</span>
      </div>
      <div className={clsx('mb-6 p-4', processing && 'bg-[#352800]')}>
        {!editDependencies ? (
          <>
            {cellInput.dependencies && Object.keys(cellInput.dependencies).length > 0 && (
              <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3 mb-4">
                <p className="font-normal text-[#d4d4d4] mb-2">Dependencies:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(cellInput.dependencies).map(([dependencyKey, dependency], index) => (
                    <li key={index} className="text-[#9cdcfe]">
                      <strong>{dependencyKey}:</strong> {dependency.cellId} ({dependency.forEach ? 'Iterate' : 'Single'}
                      ) ({dependency.type}) {'field' in dependency && `(${dependency.field})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3 mb-4">
            <p className="font-normal text-[#d4d4d4] mb-2">Dependencies:</p>

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
                      className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 flex-1"
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
                      className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 flex-1"
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
                      className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 flex-1"
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
                        className="bg-[#3c3c3c] text-[#d4d4d4] border border-[#6b6b6b] rounded px-2 py-1 flex-1"
                      >
                        <option value="">Select Field</option>
                        {kernel?.buildFieldsFromOutputReference(dependency.cellId, cellInput.id).map((cell) => {
                          return <option value={cell.id}>{cell.id}</option>;
                        })}
                      </select>
                    )}
                    <label className="text-[#d4d4d4]">Iterate</label>
                    <input
                      type={'checkbox'}
                      checked={dependency.forEach}
                      onChange={(e) => {
                        const newDeps = {...cellInput.dependencies};
                        newDeps[depKey] = {...dependency, forEach: e.target.checked};
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="form-checkbox h-5 w-5 text-[#0e639c] bg-[#3c3c3c] border-[#6b6b6b] rounded"
                    ></input>
                    <button
                      onClick={() => {
                        const newDeps = {...cellInput.dependencies};
                        delete newDeps[depKey];
                        onSave({...cellInput, dependencies: newDeps});
                      }}
                      className="bg-[#c53030] hover:bg-[#e53e3e] text-white px-2 py-1 rounded"
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
                className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded"
              >
                Add Dependency
              </button>
            </div>
          </div>
        )}

        <button onClick={() => setEditDependencies(!editDependencies)} className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded mb-4">
          <PencilIcon className="w-5 h-5 mr-2 inline" />
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
          <button onClick={() => setEditing(!editing)} className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded">
            <PencilIcon className="w-5 h-5 mr-2 inline" />
            {editing ? 'Finish Editing' : 'Edit'}
          </button>

          {processing && <p className="text-[#d7ba7d]">Processing...</p>}
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
      <h3 className="text-lg font-normal mb-3">Output {outputIndex}</h3>
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4">
        {!editing ? (
          !output.processed ? (
            <p className="text-[#d7ba7d]">Output not processed yet</p>
          ) : output.error ? (
            <ErrorDisplay error={output.error} />
          ) : !output.output ? (
            <p className="text-[#9cdcfe]">No output available</p>
          ) : (
            <>
              <CellTypeComponent cellType={output.output} dependencies={input.dependencies} />
              <button
                onClick={() => setCollapseOutputReferences(!collapseOutputReferences)}
                className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded mt-4"
              >
                <PencilIcon className="w-5 h-5 mr-2 inline" />
                {collapseOutputReferences ? 'Show Output References' : 'Hide Output References'}
              </button>
              {!collapseOutputReferences && output.outputReferences && (
                <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3 mt-4">
                  <p className="font-normal text-[#d4d4d4] mb-2">Output References:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(output.outputReferences).map(([key, value], index) => (
                      <li key={index} className="text-[#9cdcfe]">
                        <strong>{key}:</strong> {value ? <JsonViewer json={value} /> : 'No output'}
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
      <button onClick={() => setEditing(!editing)} className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded mt-4">
        <PencilIcon className="w-5 h-5 mr-2 inline" />
        {editing ? 'Finish Editing' : 'Edit'}
      </button>

      {output.outputMeta && (
        <div className="mt-2 text-sm text-[#d4d4d4]">
          <p>Tokens In: {output.outputMeta.tokensIn}</p>
          <p>Tokens Out: {output.outputMeta.tokensOut}</p>
          <p>Cost In: ${output.outputMeta.costIn.toFixed(6)}</p>
          <p>Cost Out: ${output.outputMeta.costOut.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

const ErrorDisplay = ({error}: {error: {error: string}}) => {
  return (
    <div className="bg-[#3c1e1e] text-[#f87171] p-2 rounded">
      <p className="font-normal">Error:</p>
      <p>{error.error}</p>
    </div>
  );
};

const useNotebookStore = create((set) => ({
}));

function useEffectAsync(effect: () => Promise<void>, deps: React.DependencyList) {
  React.useEffect(() => {
    effect();
  }, deps);
}

function JsonViewer({json}: {json: any}) {
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const toggleExpand = (key: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(key)) {
      newExpandedKeys.delete(key);
    } else {
      newExpandedKeys.add(key);
    }
    setExpandedKeys(newExpandedKeys);
  };

  const renderValue = (value: any, key = '', level = 0) => {
    if (typeof value === 'object' && value !== null) {
      const isArray = Array.Array = Array.Array = Array.Certainly, I'll continue with the modifications:

File Path: src/pages/Home/home.tsx
```
      const isArray = Array.isArray(value);
      const brackets = isArray ? ['[', ']'] : ['{', '}'];
      const isExpanded = expandedKeys.has(key);

      return (
        <div className="ml-4">
          <span className="cursor-pointer text-[#9cdcfe] hover:text-[#d4d4d4]" onClick={() => toggleExpand(key)}>
            {isExpanded ? '▼' : '▶'} {key}
          </span>
          {isExpanded && (
            <div className="ml-4">
              {Object.entries(value).map(([k, v], index) => (
                <div key={k}>{renderValue(v, `${key}.${k}`, level + 1)}</div>
              ))}
            </div>
          )}
          {!isExpanded && (
            <span>
              {brackets[0]}...{brackets[1]}
            </span>
          )}
        </div>
      );
    } else {
      return (
        <div className="ml-4">
          <span className="text-[#9cdcfe]">{key}: </span>
          <span className={`${typeof value === 'string' ? 'text-[#ce9178]' : 'text-[#b5cea8]'}`}>
            {JSON.stringify(value)}
          </span>
        </div>
      );
    }
  };

  try {
    return <div className="font-mono text-sm text-[#d4d4d4]">{renderValue(json)}</div>;
  } catch (error) {
    return <pre className="text-sm overflow-x-auto text-[#d4d4d4]">{json}</pre>;
  }
}

function EditableJsonViewer({json, onUpdate}: {json: any; onUpdate: (json: any) => void}) {
  const [expandedKeys, setExpandedKeys] = useState(new Set<string>());
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const toggleExpand = useCallback((key: string) => {
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

  const startEditing = useCallback((key: string) => {
    setEditingKey(key);
  }, []);

  const saveEdit = useCallback(
    (path: string, newValue: string) => {
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
    (value: any, key = '', path = '') => {
      const currentPath = path ? `${path}.${key}` : key;
      const isEditing = editingKey === currentPath;

      if (typeof value === 'object' && value !== null) {
        const isArray = Array.isArray(value);
        const brackets = isArray ? ['[', ']'] : ['{', '}'];
        const isExpanded = expandedKeys.has(currentPath);

        return (
          <div className="ml-4">
            <span
              className="cursor-pointer text-[#9cdcfe] hover:text-[#d4d4d4]"
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
                <button onClick={() => startEditing(currentPath)} className="text-[#9cdcfe] hover:text-[#d4d4d4] ml-2">
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
            <span className="text-[#9cdcfe]">{key}: </span>
            {isEditing ? (
              <EditableValue
                value={JSON.stringify(value)}
                onSave={(newValue) => saveEdit(currentPath, newValue)}
                onCancel={() => setEditingKey(null)}
              />
            ) : (
              <>
                <span className={`${typeof value === 'string' ? 'text-[#ce9178]' : 'text-[#b5cea8]'} mr-2`}>
                  {JSON.stringify(value)}
                </span>
                <button onClick={() => startEditing(currentPath)} className="text-[#9cdcfe] hover:text-[#d4d4d4]">
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

  return <div className="font-mono text-sm text-[#d4d4d4]">{renderEditableValue(json)}</div>;
}

function EditableValue({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(value);

  return (
    <>
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="bg-[#1e1e1e] text-[#d4d4d4] border border-[#3c3c3c] rounded px-2 py-1 mr-2 w-full"
        rows={editValue.split('\n').length}
      />
      <button
        onClick={() => onSave(editValue)}
        className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-2 py-1 rounded"
      >
        Save
      </button>
      <button onClick={onCancel} className="bg-[#c53030] hover:bg-[#e53e3e] text-white px-2 py-1 rounded ml-2">
        Cancel
      </button>
    </>
  );
}
```

