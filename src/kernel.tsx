import {zodToJsonSchema} from 'zod-to-json-schema';
import OpenAI from 'openai';
import {z, ZodType} from 'zod';

export async function runKernel() {
  const kernel = new NotebookKernal();
  const notebook = localStorage.getItem('notebook') ? JSON.parse(localStorage.getItem('notebook')!) : example2();
  kernel.loadBook(notebook);
  kernel.setCellInput(
    'showIdea',
    'I want a gritty crime drama that takes place in 1941 utah but in a universe where dinosaurs are mailmen'
  );
  await kernel.runCell('showIdea');
  await kernel.runCell('highLevelShowConcept');
  await kernel.runCell('showCharacters');
  await kernel.runCell('showBible');
  await kernel.runCell('season');
  await kernel.runCell('episode');
  const result = kernel.saveBook();
  localStorage.setItem('notebook', result);
  debugger;
}

function zodToString(param: () => any) {
  return param.toString().substring(param.toString().indexOf('()=>') + 4);
}

function example2() {
  /*
ask:
    whats your show idea, give as much detail as possible
example:
	I want a gritty crime drama that takes place in 1941 utah but in a universe where dinosaurs are mailmen

ai will:
 - come up with an high level show concept
 - write out a list of the characters, their backgrounds, and their arcs, motivations, etc
 - write out the show bible, including the world, the rules, the tone, the themes, etc
 - write out a 6 episode season, their plots, and how they fit into the overall story
 - dive into the details of each episode, writing out the dialogue, the action, the pacing, etc
 - write out each episode in script format
 - break the script down into scenes, and write out the shot list for each scene
 - for each scene, write out a dalle prompt to generate images
 - text to speech the dialogue in each scene
 - generate images for each scene and combine them with the text to speech audio to create a video
 - ffmpeg the videos together to create a full episode
 - upload the episode/*/
  const buildShow: Notebook = {
    metadata: {
      title: 'buildShow',
    },
    cells: [
      {
        input: {
          id: 'showIdea',
          dependencies: {},
          outputType: 'infer',
          input: {
            content: 'What is your show idea? Give as much detail as possible',
            type: 'markdown',
          },
        },
        output: {
          id: 'showIdeaOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'highLevelShowConcept',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
          },
          input: {
            prompt:
              'Here is a high level show concept for `{{showIdeaItem}}`. Write out a detailed description of the show',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            systemPrompt: 'You are a show creator writing out the show concept',
          },
        },
        output: {
          id: 'highLevelShowConceptOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'showCharacters',
          outputType: 'infer',
          dependencies: {
            highLevelShowConceptItem: {
              type: 'reference',
              cellId: 'highLevelShowConceptOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for `{{highLevelShowConceptItem}}`. Write out a list of characters, their backgrounds, and their arcs, motivations, etc',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            schema: zodToString(() =>
              z.array(
                z.object({
                  characterName: z.string({}),
                  characterBackground: z.string({}),
                  characterArc: z.string({}),
                  characterMotivation: z.string({}),
                })
              )
            ),
            systemPrompt: 'You are a show creator writing out the characters',
          },
        },
        output: {
          id: 'showCharactersOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'showBible',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'reference',
              cellId: 'showCharactersOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for `{{showIdeaItem}}` and the characters `{{showCharactersItem}}`. Write out the show bible, including the world, the rules, the tone, the themes, etc',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            systemPrompt: 'You are a show creator writing out the show bible',
          },
        },
        output: {
          id: 'showBibleOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'season',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'reference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'reference',
              cellId: 'showBibleOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for `{{showIdeaItem}}`, the characters `{{showCharactersItem}}`, and the show bible `{{showBibleItem}}`. Write out a 6 episode season, their plots, and how they fit into the overall story',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            schema: zodToString(() =>
              z.array(
                z.object({
                  episodeNumber: z.number({}),
                  episodePlot: z.string({}),
                  episodeFit: z.string({}),
                })
              )
            ),
            systemPrompt: 'You are a show creator writing out the season',
          },
        },
        output: {
          id: 'seasonOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'episode',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'reference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'reference',
              cellId: 'showBibleOutput',
            },
            seasonItem: {
              type: 'reference',
              cellId: 'seasonOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for `{{showIdeaItem}}`, the characters `{{showCharactersItem}}`, the show bible `{{showBibleItem}}`, and the season `{{seasonItem}}`. Dive into the details of each episode, writing out the dialogue, the action, the pacing, etc',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            schema: zodToString(() =>
              z.array(
                z.object({
                  episodeNumber: z.number({}),
                  episodeDialogue: z.string({}),
                  episodeAction: z.string({}),
                  episodePacing: z.string({}),
                })
              )
            ),
            systemPrompt: 'You are a show creator writing out the episode',
          },
        },
        output: {
          id: 'episodeOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'episodeScript',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'reference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'reference',
              cellId: 'showBibleOutput',
            },
            seasonItem: {
              type: 'reference',
              cellId: 'seasonOutput',
            },
            episodeItem: {
              type: 'reference',
              array: true,
              cellId: 'episodeOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for `{{showIdeaItem}}`, the characters `{{showCharactersItem}}`, the show bible `{{showBibleItem}}`, the season `{{seasonItem}}`. The episode is `{{episodeItem}}`. Write out the episode in script format',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            systemPrompt: 'You are a show creator writing out the episode script',
          },
        },
        output: {
          id: 'episodeScriptOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'episodeScenes',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'reference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'reference',
              cellId: 'showBibleOutput',
            },
            seasonItem: {
              type: 'reference',
              cellId: 'seasonOutput',
            },
            episodeItem: {
              type: 'reference',
              cellId: 'episodeOutput',
            },
            episodeScriptItem: {
              type: 'reference',
              array: true,
              cellId: 'episodeScriptOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for `{{showIdeaItem}}`, the characters `{{showCharactersItem}}`, the show bible `{{showBibleItem}}`, the season `{{seasonItem}}`, the episode `{{episodeItem}}`, and the episode script `{{episodeScriptItem}}`. Break the script down into scenes, and write out the shot list for each scene',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            schema: zodToString(() =>
              z.array(
                z.object({
                  sceneNumber: z.number({}),
                  sceneShotList: z.string({}),
                })
              )
            ),
            systemPrompt: 'You are a show creator writing out the episode scenes',
          },
        },
        output: {
          id: 'episodeScenesOutput',
          processed: false,
        },
      },
    ],
  };
  return buildShow;
}
function example1() {
  const buildMeshGradient: Notebook = {
    metadata: {
      title: 'buildMeshGradient',
    },
    cells: [
      {
        input: {
          id: 'defineTasks',
          dependencies: {},
          outputType: 'infer',
          input: {
            prompt:
              "I want a mesh gradient swift react native expo plugin, what are the steps to accomplish this. Don't give me the code, just the steps",
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            schema: zodToString(() => z.array(z.string({}))),
            systemPrompt: 'You are a react native developer building a mesh gradient plugin',
          },
        },
        output: {
          id: 'defineTasksOutput',
          processed: false,
        },
      },
      {
        input: {
          id: 'executeTasks',
          outputType: 'infer',
          dependencies: {
            defineTasksOutputItem: {
              type: 'reference',
              array: true,
              cellId: 'defineTasksOutput',
            },
          },
          input: {
            prompt:
              'Here is a step in building a mesh gradient swift react native expo plugin: `{{defineTasksOutputItem}}`. Please write the code for this step',
            model: 'gpt-3.5-turbo-0125',
            type: 'aiPrompt',
            schema: zodToString(() => z.array(z.string({}))),
            systemPrompt: 'You are a developer building a mesh gradient plugin',
          },
        },
        output: {
          id: 'executeTasks',
          processed: false,
        },
      },
    ],
  };
}

type Notebook = {
  cells: {
    input: CellInput;
    output: CellOutput;
  }[];
  metadata: {
    title: string;
  };
};

type CellInputFeed = {
  [key: string]: {
    type: 'reference';
    array?: boolean;
    cellId: string;
  };
};

type CellInput = {
  id: string; // overwritable
  dependencies?: CellInputFeed;
  outputType: 'infer' | 'markdown' | 'image' | 'webpage' | 'table' | 'reactComponent';
  input: CellTypes;
};
type CellOutput = {
  id?: string; // overwritable
  processed: boolean;
  output?: CellTypes;
  error?: CellOutputError;
  outputMeta?: {
    type: 'aiPrompt';
    tokensIn: number;
    tokensOut: number;
    costIn: number;
    costOut: number;
  };
};
type CellOutputError = {
  error: string;
};
type CellTypes =
  | {
      content: string;
      type: 'markdown';
    }
  | {
      content: string;
      type: 'code';
    }
  | {
      type: 'aiPrompt';
      temperature?: number;
      prompt: string;
      model: string;
      systemPrompt: string;
      schema?: string;
    }
  | {
      type: 'aiImagePrompt';
      prompt: string;
      model: string;
    }
  | {
      type: 'markdown';
      content: string;
    }
  | {
      type: 'number';
      value: number;
    }
  | {
      type: 'image';
      content: string;
    }
  | {
      type: 'webpage';
      content: string;
    }
  | {
      type: 'json';
      value: string;
    }
  | {
      type: 'jsonArray';
      values: string[];
    }
  | {
      type: 'table';
      cells: string[][];
    };

class NotebookKernal {
  private notebook?: Notebook;
  async runCell(cellId: string, force = false) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }

    const cellElement = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cellElement) {
      throw new Error('Cell not found');
    }
    if (cellElement.input.id === cellId) {
      if (cellElement.output.processed && !force) {
        return;
      }
      const output = await this.runCellInput(cellElement.input, cellElement.output);
      cellElement.output = output;
    }
  }

  // runBook(notebook: Notebook) {}

  loadBook(notebook: Notebook) {
    this.notebook = structuredClone(notebook);
  }

  setCellInput(cell: 'showIdea', text: string) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    for (const cellElement of this.notebook.cells) {
      if (cellElement.input.id === cell) {
        if (cellElement.input.input.type !== 'markdown') {
          throw new Error('Cell type must be markdown to set input');
        }
        cellElement.input.input.content = text;
      }
    }
  }

  private async runCellInput(input: CellInput, output: CellOutput): Promise<CellOutput> {
    const dependencies: {[key: string]: CellTypes | CellTypes[] | undefined} = {};
    const dependencyArrays: {[key: string]: boolean} = {};
    if (input.dependencies) {
      for (const dependencyKey in input.dependencies) {
        const dependency = input.dependencies[dependencyKey];
        switch (dependency.type) {
          case 'reference': {
            const cell = this.notebook?.cells.find(
              (x) => x.input.id === dependency.cellId || x.output.id === dependency.cellId
            );
            if (!cell) {
              throw new Error('Cell not found');
            }

            if (cell.input.id === dependency.cellId) {
              const result = cellToArrayOrValue(cell.input.input);
              if (!result) continue;
              if (dependency.array) {
                dependencyArrays[dependencyKey] = true;
                if (result.type === 'array') {
                  dependencies[dependencyKey] = result.values.map((x) => x);
                } else {
                  dependencies[dependencyKey] = [result.value];
                }
              } else {
                dependencies[dependencyKey] = result.value;
              }
            } else {
              if (!cell.output.processed) {
                await this.runCell(cell.input.id);
              }
              const result = cellToArrayOrValue(cell.output.output);
              if (!result) continue;
              if (dependency.array) {
                dependencyArrays[dependencyKey] = true;
                if (result.type === 'array') {
                  dependencies[dependencyKey] = result.values.map((x) => x);
                } else {
                  dependencies[dependencyKey] = [result.value];
                }
              } else {
                dependencies[dependencyKey] = result.value;
              }
            }
            break;
          }
          default:
            throw unreachable(dependency.type);
        }
      }
    }
    if (Object.keys(dependencyArrays).length > 0) {
      throw new Error('Not implemented');
    }

    switch (input.input.type) {
      case 'number':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'number',
            value: input.input.value,
          },
        };
      case 'image':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'image',
            content: input.input.content,
          },
        };
      case 'webpage':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'webpage',
            content: input.input.content,
          },
        };
      case 'table':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'table',
            cells: input.input.cells,
          },
        };
      case 'json':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'json',
            value: input.input.value,
          },
        };
      case 'jsonArray':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'jsonArray',
            values: input.input.values,
          },
        };
      case 'markdown':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'markdown',
            content: processWithDependencies(input.input.content, dependencies),
          },
        };
      case 'code': {
        const result = await runCode(processWithDependencies(input.input.content, dependencies));
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: inferOutput(result),
        };
      }
      case 'aiPrompt': {
        const result = await runAI(input.input, dependencies);
        if ('error' in result) {
          return {
            id: output.id ?? input.id + 'Output',
            processed: true,
            error: {
              error: result.error,
            },
          };
        }
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: inferOutput(result.result),
          outputMeta: {
            type: 'aiPrompt',
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            costIn: result.costIn,
            costOut: result.costOut,
          },
        };
      }
      case 'aiImagePrompt':
        throw new Error('Not implemented');

      default:
        throw unreachable(input.input);
    }
  }

  saveBook() {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    return JSON.stringify(structuredClone(this.notebook), null, 2);
  }
}

async function runCode(content: string) {
  const result = new Function(content)();
  return result;
}
function inferOutput(result: any): CellTypes {
  if (typeof result === 'string') {
    return {
      type: 'markdown',
      content: result,
    };
  }
  if (typeof result === 'number') {
    return {
      type: 'number',
      value: result,
    };
  }

  if (typeof result === 'object') {
    if (Array.isArray(result)) {
      return {
        type: 'jsonArray',
        values: result.map((x) => {
          return JSON.stringify(x);
        }),
      };
    }
    return {
      type: 'json',
      value: JSON.stringify(result),
    };
  }
  throw new Error('Could not infer output type');
}

function unreachable(x: never): never {
  throw new Error('Unreachable');
}

type AIInput = {
  type: 'aiPrompt';
  prompt: string;
  temperature?: number;
  model: string;
  systemPrompt: string;
  schema?: string;
};

async function runAI(
  input: AIInput,
  dependencies: {[key: string]: any} = {}
): Promise<
  | {
      result: any;
      tokensIn: number;
      tokensOut: number;
      costIn: number;
      costOut: number;
    }
  | CellOutputError
> {
  const client = new OpenAI({fetch: fetch, apiKey: import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true});

  let zodSchema = new Function('z', 'return ' + input.schema)(z) as ZodType<any>;

  // if zodSchema is an array, wrap it in an object
  const wasArray = 'typeName' in zodSchema._def && zodSchema._def.typeName === 'ZodArray';
  zodSchema = wasArray ? z.object({items: zodSchema}) : zodSchema;

  const schema = input.schema ? zodToJsonSchema(zodSchema) : undefined;
  let retry = 0;
  while (retry < 3) {
    debugger;
    const result = await client.chat.completions.create({
      // stream: true,
      model: input.model,
      temperature: input.temperature,
      messages: [
        {role: 'system' as const, content: processWithDependencies(input.systemPrompt, dependencies)},
        {role: 'user' as const, content: processWithDependencies(input.prompt, dependencies)},
      ],
      ...(schema
        ? {
            functions: [
              {
                name: 'getModel',
                parameters: schema,
              },
            ],

            function_call: {
              name: 'getModel',
            },
          }
        : {}),
    });
    const tokensIn = result.usage?.prompt_tokens ?? 0;
    const tokensOut = result.usage?.completion_tokens ?? 0;
    const costIn = input.model.includes('gpt-4') ? (tokensIn / 1000000) * 30 : (tokensIn / 1000000) * 0.5;
    const costOut = input.model.includes('gpt-4') ? (tokensIn / 1000000) * 60 : (tokensIn / 1000000) * 1.5;
    console.log(JSON.stringify(result, null, 2));
    console.log(tokensIn, tokensOut, costIn, costOut, costIn + costOut);

    if (!schema) {
      return {
        result: result.choices[0].message.content,
        tokensIn: tokensIn,
        tokensOut: tokensOut,
        costIn: costIn,
        costOut: costOut,
      };
    }

    try {
      if (result.choices[0]?.message?.function_call?.arguments) {
        // console.log(JSON.stringify(result, null, 2));
        let jsonResult = new Function('return ' + result.choices[0].message.function_call.arguments)();
        if (wasArray) {
          jsonResult = jsonResult.items;
        }
        return {
          result: jsonResult,
          tokensIn: tokensIn,
          tokensOut: tokensOut,
          costIn: costIn,
          costOut: costOut,
        };
      }
      retry++;
      console.log('fail');
      console.log(JSON.stringify(result, null, 2));
    } catch (ex: any) {
      retry++;
      console.log(
        JSON.stringify({
          message: ex.message,
          result: result,
        })
      );
    }
  }
  return {
    error: 'Failed to generate',
  };
}
function processWithDependencies(content: string, dependencies: {[p: string]: CellTypes | CellTypes[] | undefined}) {
  for (const key in dependencies) {
    const dependency = dependencies[key];

    const dependencyString = cellToString(dependency);

    content = content.replace(`{{${key}}}`, dependencyString);
  }
  return content;
}

function cellToString(cell: CellTypes | CellTypes[] | undefined): string {
  if (Array.isArray(cell)) {
    return cell.map((x) => cellToString(x)).join('\n');
  }
  switch (cell?.type) {
    case undefined:
      return '';
    case 'markdown':
      return cell.content;
    case 'json':
      return cell.value;
    case 'jsonArray':
      return JSON.stringify(cell.values);
    case 'number':
      return cell.value.toString();
    case 'image':
      return `![image](${cell.content})`;
    case 'webpage':
      return `[webpage](${cell.content})`;
    case 'table':
      return `| ${cell.cells[0].join(' | ')} |\n| ${cell.cells[1].join(' | ')} |`;
    case 'code':
      return cell.content;
    case 'aiPrompt':
      return cell.prompt;
    case 'aiImagePrompt':
      return cell.prompt;
    default:
      throw unreachable(cell);
  }
}

function cellToArrayOrValue(cell: CellTypes | undefined):
  | {
      type: 'array';
      values: CellTypes[];
      value: CellTypes;
    }
  | {
      type: 'value';
      value: CellTypes;
    }
  | undefined {
  switch (cell?.type) {
    case undefined:
      return undefined;
    case 'markdown':
      // do stuff here to parse if its an arrya, like 1.2.3 or ```json
      return {type: 'value', value: cell};
    case 'json':
      return {
        type: 'value',
        value: cell,
      };
    case 'jsonArray':
      return {
        type: 'array',
        value: cell,
        values: cell.values.map((x) => ({
          type: 'json',
          value: x,
        })),
      };
    case 'number':
      return {
        type: 'value',
        value: cell,
      };
    case 'image':
      return {type: 'value', value: cell};
    case 'webpage':
      return {type: 'value', value: cell};
    case 'table':
      return {
        type: 'array',
        value: cell,
        values: cell.cells.map((x) => ({
          type: 'jsonArray',
          values: x,
        })),
      };
    case 'code':
      return {type: 'value', value: cell};
    case 'aiPrompt':
      return {
        type: 'value',
        value: cell,
      };
    case 'aiImagePrompt':
      return {
        type: 'value',
        value: cell,
      };
    default:
      throw unreachable(cell);
  }
}

function parseCell(cell: CellTypes | undefined): any {
  switch (cell?.type) {
    case undefined:
      return undefined;
    case 'markdown':
      return cell.content;
    case 'json':
      return JSON.parse(cell.value);
    case 'jsonArray':
      return cell.values.map((x) => JSON.parse(x));
    case 'number':
      return cell.value;
    case 'image':
      return cell.content;
    case 'webpage':
      return cell.content;
    case 'table':
      return cell.cells;
    case 'code':
      return cell.content;
    case 'aiPrompt':
      return cell.prompt;
    case 'aiImagePrompt':
      return cell.prompt;
    default:
      throw unreachable(cell);
  }
}
