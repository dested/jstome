import Markdown from 'react-markdown';
import React, {useEffect, useState} from 'react';
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
import Editor, {DiffEditor, useMonaco, loader} from '@monaco-editor/react';

export const Home: FC = () => {
  const [notebook, setNotebook] = useState<Notebook | undefined>();
  useEffect(() => {
    const nb = localStorage.getItem('notebook') ? JSON.parse(localStorage.getItem('notebook')!) : example2();
    setNotebook(nb);
  }, []);

  return (
    <>
      <section>
        <button
          className="btn-primary btn"
          onClick={async () => {
            if (notebook) await runKernel(notebook);
          }}
        >
          Run Kernel
        </button>
        {notebook && <NotebookViewer notebook={notebook} />}
      </section>
    </>
  );
};

// Main NotebookViewer component
const NotebookViewer = ({notebook}: {notebook: Notebook}) => {
  const outputMetaMap = notebook.cells.map((cell) => cell.output.outputMeta).filter((a) => !!a);
  const outputMeta = outputMetaMap.reduce(
    (acc, curr) => {
      return {
        tokensIn: acc.tokensIn + curr.tokensIn,
        tokensOut: acc.tokensOut + curr.tokensOut,
        costIn: acc.costIn + curr.costIn,
        costOut: acc.costOut + curr.costOut,
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
    <div className="container mx-auto p-4 bg-base-100">
      {isLoaded && (
        <NotebookKernelContext.Provider value={kernelRef.current}>
          <NotebookHeader metadata={notebook.metadata} />
          <div className="mt-2 text-sm text-base-content/70">
            <p>Tokens In: {outputMeta.tokensIn}</p>
            <p>Tokens Out: {outputMeta.tokensOut}</p>
            <p>Cost In: ${outputMeta.costIn.toFixed(6)}</p>
            <p>Cost Out: ${outputMeta.costOut.toFixed(6)}</p>
          </div>
          <div className="space-y-4">
            {notebook.cells.map((cell, index) => (
              <CellContainer key={index} cell={cell} />
            ))}
          </div>
        </NotebookKernelContext.Provider>
      )}
    </div>
  );
};

const NotebookKernelContext = React.createContext<NotebookKernel | null>(null);

// NotebookHeader component
const NotebookHeader = ({metadata}: {metadata: Notebook['metadata']}) => {
  return (
    <div className="bg-primary text-primary-content p-4 rounded-lg mb-4">
      <h1 className="text-2xl font-bold">{metadata.title}</h1>
    </div>
  );
};

// CellContainer component
const CellContainer = ({cell}: {cell: Notebook['cells'][number]}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="border border-base-300 rounded-lg shadow-sm">
      <div className="flex items-center p-2 bg-base-200 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <ChevronDownIcon className="w-5 h-5 mr-2" /> : <ChevronRightIcon className="w-5 h-5 mr-2" />}
        <span className="font-semibold">Cell {cell.input.id}</span>
      </div>
      {isExpanded && (
        <div className="p-4">
          <CellInputComponent input={cell.input} />
          <CellOutputComponent output={cell.output} />
        </div>
      )}
    </div>
  );
};

export const CellTypeComponent = ({cellType}: {cellType: CellTypes}) => {
  switch (cellType.type) {
    case 'number':
      return <p>{cellType.value}</p>;
    case 'image':
      return <img src={cellType.content} alt="Input" className="max-w-full h-auto" />;
    case 'webpage':
      return <iframe src={cellType.content} className="w-full h-64 border-0" />;
    case 'json':
      return <ObjectViewer object={cellType.value} />;
    case 'jsonArray':
      return (
        <div className={'space-y-4'}>
          {cellType.values.map((value, index) => (
            <ObjectViewer key={index} object={value} />
          ))}
        </div>
      );
    case 'table':
      return (
        <table className="table table-zebra w-full">
          <tbody>
            {cellType.cells.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'array':
      return (
        <div className={'space-y-4'}>
          {cellType.cells.map((value, index) => (
            <CellOutputComponent key={index} output={value} />
          ))}
        </div>
      );
    case 'markdown':
      return <Markdown className={'prose max-h-[50vh] overflow-y-auto w-full'}>{cellType.content}</Markdown>;
    case 'code':
      return (
        <pre className="bg-base-200 p-2 rounded prose">
          <code>{cellType.content}</code>
        </pre>
      );
    case 'aiPrompt':
      return (
        <div>
          <p>
            <strong>Prompt:</strong> {cellType.prompt}
          </p>
          <p>
            <strong>Model:</strong> {cellType.model}
          </p>
          <p>
            <strong>Temperature:</strong> {cellType.temperature || 'N/A'}
          </p>
          <p>
            <strong>Schema:</strong> {cellType.schema || 'N/A'}
          </p>
        </div>
      );
    case 'aiImagePrompt':
      return (
        <div>
          <p>
            <strong>Image Prompt:</strong> {cellType.prompt}
          </p>
          <p>
            <strong>Model:</strong> {cellType.model}
          </p>
        </div>
      );

    default:
      return <p>Unsupported input type: {cellType.type}</p>;
  }
};

function CellTypeComponentEditable({
  cellType,
  onSave,
}: {
  cellType: CellTypes | undefined;
  onSave: (cellType: CellTypes) => void;
}) {
  function renderCellTypes() {
    if (!cellType) return <></>;
    switch (cellType.type) {
      case 'number':
        return (
          <input
            type="number"
            value={cellType.value}
            onChange={(e) =>
              onSave({
                type: 'number',
                value: parseFloat(e.target.value),
              })
            }
            className="input input-primary w-full"
          />
        );
      case 'image':
        return (
          <input
            type="text"
            value={cellType.content}
            onChange={(e) =>
              onSave({
                type: 'image',
                content: e.target.value,
              })
            }
            className="input input-primary w-full"
          />
        );
      case 'webpage':
        return <>Not Supported</>;
      case 'json':
        return (
          <ObjectEditor
            object={cellType.value}
            onSave={(e) => {
              onSave({
                type: 'json',
                value: e,
              });
            }}
          />
        );
      case 'jsonArray':
        return (
          <div className={'space-y-4'}>
            {cellType.values.map((value, index) => (
              <ObjectEditor
                key={index}
                object={value}
                onSave={(e) => {
                  const newValues = [...cellType.values];
                  newValues[index] = e;
                  onSave({
                    type: 'jsonArray',
                    values: newValues,
                  });
                }}
              />
            ))}
          </div>
        );
      case 'table':
        return <>Not editable yet</>;
      case 'array':
        return (
          <div className={'space-y-4'}>
            {cellType.cells.map(
              (value, index) =>
                value.output && (
                  <CellTypeComponentEditable
                    key={index}
                    cellType={value.output}
                    onSave={(e) => {
                      const newCells = [...cellType.cells];
                      newCells[index] = {
                        ...newCells[index],
                        output: e,
                      };
                      onSave({
                        type: 'array',
                        cells: newCells,
                      });
                    }}
                  />
                )
            )}
          </div>
        );
      case 'markdown':
        return (
          <Editor
            options={{
              wordWrap: 'on',
            }}
            height="50vh"
            defaultLanguage="markdown"
            defaultValue={cellType.content}
            onChange={(e) => {
              onSave({
                type: 'markdown',
                content: e!,
              });
            }}
          />
        );
      case 'code':
        return (
          <Editor
            options={{
              wordWrap: 'on',
            }}
            height="50vh"
            defaultLanguage="javascript"
            defaultValue={cellType.content}
            onChange={(e) => {
              onSave({
                type: 'code',
                content: e!,
              });
            }}
          />
        );
      case 'aiPrompt':
        return (
          <div>
            <p>
              <strong>Prompt:</strong>
              <Editor
                options={{
                  wordWrap: 'on',
                }}
                height="50vh"
                defaultLanguage="markdown"
                defaultValue={cellType.prompt}
                onChange={(e) => {
                  onSave({
                    type: 'aiPrompt',
                    prompt: e!,
                    schema: cellType.schema,
                    systemPrompt: cellType.systemPrompt,
                    model: cellType.model,
                    temperature: cellType.temperature,
                  });
                }}
              />
            </p>
            <p>
              <strong>Model:</strong>
              <select
                value={cellType.model}
                onChange={(e) => {
                  onSave({
                    type: 'aiPrompt',
                    prompt: cellType.prompt,
                    schema: cellType.schema,
                    systemPrompt: cellType.systemPrompt,
                    model: e.target.value,
                    temperature: cellType.temperature,
                  });
                }}
                className="input input-primary w-full"
              >
                <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</option>
              </select>
            </p>
            <p>
              <strong>Temperature:</strong>{' '}
              <input
                type="number"
                value={cellType.temperature}
                className="input input-primary w-full"
                step={0.1}
                min={0}
                max={2}
                onChange={(e) => {
                  onSave({
                    type: 'aiPrompt',
                    prompt: cellType.prompt,
                    schema: cellType.schema,
                    systemPrompt: cellType.systemPrompt,
                    model: cellType.model,
                    temperature: parseFloat(e.target.value),
                  });
                }}
              />
            </p>
            <p>
              <strong>Schema:</strong>{' '}
              <input
                type="string"
                value={cellType.schema}
                className="input input-primary w-full"
                onChange={(e) => {
                  onSave({
                    type: 'aiPrompt',
                    prompt: cellType.prompt,
                    schema: e.target.value,
                    systemPrompt: cellType.systemPrompt,
                    model: cellType.model,
                    temperature: cellType.temperature,
                  });
                }}
              />
            </p>
          </div>
        );
      case 'aiImagePrompt':
        return <div>Not editable yet</div>;

      default:
        return <p>Unsupported input type: {cellType.type}</p>;
    }
  }

  return (
    <div>
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
            case 'array':
              onSave({
                type: 'array',
                cells: [],
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
      >
        <option value="number">Number</option>
        <option value="image">Image</option>
        <option value="webpage">Webpage</option>
        <option value="json">JSON</option>
        <option value="jsonArray">JSON Array</option>
        <option value="table">Table</option>
        <option value="array">Array</option>
        <option value="markdown">Markdown</option>
        <option value="code">Code</option>
        <option value="aiPrompt">AI Prompt</option>
        <option value="aiImagePrompt">AI Image Prompt</option>
      </select>
      {renderCellTypes()}
    </div>
  );
}

const CellInputComponent = ({input}: {input: CellInput}) => {
  const [editing, setEditing] = useState(false);

  const kernel = React.useContext(NotebookKernelContext);

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Input</h3>
      {!editing ? (
        <CellTypeComponent cellType={input.input} />
      ) : (
        <CellTypeComponentEditable
          cellType={input.input}
          onSave={(e) => {
            input.input = e;
          }}
        />
      )}
      <button onClick={() => setEditing(!editing)} className={'btn btn-primary mt-2'}>
        <span className="mr-2">{editing ? 'Finish Editing' : 'Edit'}</span>
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      <button onClick={() => kernel?.runCell(input.id)} className={'btn btn-primary mt-2'}>
        <span className="mr-2">{kernel?.cellHasOutput(input.id) ? 'Re-run Cell' : 'Run Cell'}</span>
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

function ObjectViewer(props: {object: string}) {
  const obj = JSON.parse(props.object);
  return (
    <div className="overflow-x-auto bg-gray-200 rounded-xl">
      <table className="table table-zebra w-full">
        <tbody>
          {Object.keys(obj).map((key, index) => (
            <tr key={index}>
              <td>{key}</td>
              <td>{obj[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ObjectEditor(props: {object: string; onSave: (value: string) => void}) {
  const obj = JSON.parse(props.object);
  return (
    <div className="overflow-x-auto bg-gray-200 rounded-xl">
      <table className="table table-zebra w-full">
        <tbody>
          {Object.keys(obj).map((key, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newObj = {...obj};
                    delete newObj[key];
                    newObj[e.target.value] = obj[key];
                    props.onSave(JSON.stringify(newObj));
                  }}
                  className="input input-primary w-full"
                />
              </td>
              <td>
                {typeof obj[key] === 'string' ? (
                  <input
                    type="text"
                    value={obj[key]}
                    onChange={(e) => {
                      const newObj = {...obj};
                      newObj[key] = e.target.value;
                      props.onSave(JSON.stringify(newObj));
                    }}
                    className="input input-primary w-full"
                  />
                ) : typeof obj[key] === 'number' ? (
                  <input
                    type="number"
                    value={obj[key]}
                    onChange={(e) => {
                      const newObj = {...obj};
                      newObj[key] = e.target.value;
                      props.onSave(JSON.stringify(newObj));
                    }}
                    className="input input-primary w-full"
                  />
                ) : typeof obj[key] === 'object' ? (
                  <ObjectEditor
                    object={JSON.stringify(obj[key])}
                    onSave={(e) => {
                      const newObj = {...obj};
                      newObj[key] = JSON.parse(e);
                      props.onSave(JSON.stringify(newObj));
                    }}
                  />
                ) : (
                  <>Unsupported edit</>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// CellOutput component
const CellOutputComponent = ({output}: {output: CellOutput}) => {
  const renderOutput = () => {
    if (!output.processed) {
      return <p className="text-warning">Output not processed yet</p>;
    }

    if (output.error) {
      return <ErrorDisplay error={output.error} />;
    }

    if (!output.output) {
      return <p className="text-info">No output available</p>;
    }

    return <CellTypeComponent cellType={output.output} />;
  };

  const [editing, setEditing] = useState(false);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Output</h3>
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
      <button onClick={() => setEditing(!editing)} className={'btn btn-primary mt-2'}>
        <span className="mr-2">{editing ? 'Finish Editing' : 'Edit'}</span>
        <ChevronRightIcon className="w-5 h-5" />
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
