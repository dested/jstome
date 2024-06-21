import {zodToJsonSchema} from 'zod-to-json-schema';
import OpenAI from 'openai';
import {z, ZodType} from 'zod';

export async function runKernel() {
  const kernel = new NotebookKernal();
  kernel.loadBook(example2());
  kernel.setCellInput(
    'showIdea',
    'I want a gritty crime drama that takes place in 1941 utah but in a universe where dinosaurs are mailmen'
  );
  kernel.runCell('showIdea');
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
          inputFeed: {},
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
          inputFeed: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
          },
          input: {
            prompt:
              'Here is a high level show concept for {{showIdeaItem}}. Write out a detailed description of the show',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.string({}),
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
          inputFeed: {
            showIdeaItem: {
              type: 'reference',
              cellId: 'showIdeaOutput',
            },
          },
          input: {
            prompt:
              'Here are is the high level show concept for {{showIdeaItem}}. Write out a list of characters, their backgrounds, and their arcs, motivations, etc',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.array({
              characterName: z.string({}),
              characterBackground: z.string({}),
              characterArc: z.string({}),
              characterMotivation: z.string({}),
            }),
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
          inputFeed: {
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
              'Here are is the high level show concept for {{showIdeaItem}} and the characters {{showCharactersItem}}. Write out the show bible, including the world, the rules, the tone, the themes, etc',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.string({}),
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
          inputFeed: {
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
              'Here are is the high level show concept for {{showIdeaItem}}, the characters {{showCharactersItem}}, and the show bible {{showBibleItem}}. Write out a 6 episode season, their plots, and how they fit into the overall story',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.array({
              episodeNumber: z.number({}),
              episodePlot: z.string({}),
              episodeFit: z.string({}),
            }),
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
          inputFeed: {
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
              'Here are is the high level show concept for {{showIdeaItem}}, the characters {{showCharactersItem}}, the show bible {{showBibleItem}}, and the season {{seasonItem}}. Dive into the details of each episode, writing out the dialogue, the action, the pacing, etc',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.array({
              episodeNumber: z.number({}),
              episodeDialogue: z.string({}),
              episodeAction: z.string({}),
              episodePacing: z.string({}),
            }),
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
          inputFeed: {
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
              'Here are is the high level show concept for {{showIdeaItem}}, the characters {{showCharactersItem}}, the show bible {{showBibleItem}}, the season {{seasonItem}}. The episode is {{episodeItem}}. Write out the episode in script format',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.string({}),
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
          inputFeed: {
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
              'Here are is the high level show concept for {{showIdeaItem}}, the characters {{showCharactersItem}}, the show bible {{showBibleItem}}, the season {{seasonItem}}, the episode {{episodeItem}}, and the episode script {{episodeScriptItem}}. Break the script down into scenes, and write out the shot list for each scene',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.array({
              sceneNumber: z.number({}),
              sceneShotList: z.string({}),
            }),
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
          inputFeed: {},
          input: {
            prompt:
              "I want a mesh gradient swift react native expo plugin, what are the steps to accomplish this. Don't give me the code, just the steps",
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.array(z.string({})),
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
          inputFeed: {
            defineTasksOutputItem: {
              type: 'reference',
              array: true,
              cellId: 'defineTasksOutput',
            },
          },
          input: {
            prompt:
              'Here is a step in building a mesh gradient swift react native expo plugin: {{defineTasksOutputItem}}. Please write the code for this step',
            model: 'gpt-3',
            type: 'aiPrompt',
            schema: z.array(z.string({})),
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
  inputFeed: CellInputFeed;
  input:
    | {
        content: string;
        type: 'markdown';
      }
    | {
        content: string;
        type: 'code';
        ouptputType: 'markdown' | 'image' | 'webpage' | 'table' | 'reactComponent';
      }
    | {
        type: 'aiPrompt';
        temperature?: number;
        prompt: string;
        model: string;
        systemPrompt: string;
        schema: z.ZodType;
      }
    | {
        type: 'aiImagePrompt';
        prompt: string;
        model: string;
      };
};
type CellOutput = {
  id?: string; // overwritable
  processed: boolean;
  output?: CellOutputTypes;
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
type CellOutputTypes =
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
  async runCell(cellId: string) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    for (const cellElement of this.notebook.cells) {
      if (cellElement.input.id === cellId) {
        const output = await this.runCellInput(cellElement.input, cellElement.output);
        cellElement.output = output;
      }
    }
  }

  runBook(notebook: Notebook) {}

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
    switch (input.input.type) {
      case 'markdown':
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: {
            type: 'markdown',
            content: input.input.content,
          },
        };
      case 'code': {
        const result = await runCode(input.input.content);
        return {
          id: output.id ?? input.id + 'Output',
          processed: true,
          output: inferOutput(result),
        };
      }
      case 'aiPrompt': {
        const result = await runAI(input.input);
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
}

async function runCode(content: string) {
  const result = new Function(content)();
  return result;
}
function inferOutput(result: any): CellOutputTypes {
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
  schema: ZodType<any>;
};

async function runAI(input: AIInput): Promise<
  | {
      result: any;
      tokensIn: number;
      tokensOut: number;
      costIn: number;
      costOut: number;
    }
  | CellOutputError
> {
  const client = new OpenAI({fetch: fetch, apiKey: import.meta.env.VITE_OPENAI_KEY});
  const schema = input.schema ? zodToJsonSchema(input.schema) : undefined;
  let retry = 0;
  while (retry < 3) {
    const result = await client.chat.completions.create({
      // stream: true,
      model: input.model,
      temperature: input.temperature,
      messages: [
        {role: 'system' as const, content: input.systemPrompt},
        {role: 'user' as const, content: input.prompt},
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
        return {
          result: new Function('return ' + result.choices[0].message.function_call.arguments)(),
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
