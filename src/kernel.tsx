import {zodToJsonSchema} from 'zod-to-json-schema';
import OpenAI from 'openai';
import {z, ZodType} from 'zod';
import {RunUtils, RunUtilsImage, RunUtilsVideo} from '@/RunUtils.ts';
import * as JSZip from 'jszip';

function zodToString(param: () => any) {
  return param.toString().substring(param.toString().indexOf('()=>') + 4);
}

export function example2() {
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
    assetLookup: [],
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
      },
      {
        input: {
          id: 'highLevelShowConcept',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'cellReference',
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
      },
      {
        input: {
          id: 'showCharacters',
          outputType: 'infer',
          dependencies: {
            highLevelShowConceptItem: {
              type: 'cellReference',
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
      },
      {
        input: {
          id: 'showBible',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'cellReference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'cellReference',
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
      },
      {
        input: {
          id: 'season',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'cellReference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'cellReference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'cellReference',
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
      },
      {
        input: {
          id: 'episode',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'cellReference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'cellReference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'cellReference',
              cellId: 'showBibleOutput',
            },
            seasonItem: {
              type: 'cellReference',
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
      },
      {
        input: {
          id: 'episodeScript',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'cellReference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'cellReference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'cellReference',
              cellId: 'showBibleOutput',
            },
            seasonItem: {
              type: 'cellReference',
              cellId: 'seasonOutput',
            },
            episodeItem: {
              type: 'cellReference',
              forEach: true,
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
      },
      {
        input: {
          id: 'episodeScenes',
          outputType: 'infer',
          dependencies: {
            showIdeaItem: {
              type: 'cellReference',
              cellId: 'showIdeaOutput',
            },
            showCharactersItem: {
              type: 'cellReference',
              cellId: 'showCharactersOutput',
            },
            showBibleItem: {
              type: 'cellReference',
              cellId: 'showBibleOutput',
            },
            seasonItem: {
              type: 'cellReference',
              cellId: 'seasonOutput',
            },
            episodeScriptItem: {
              type: 'cellReference',
              cellId: 'episodeScriptOutput',
              forEach: true,
            },
            episodeItem: {
              type: 'outputReference',
              cellId: 'episodeScriptOutput',
              field: 'episodeItem',
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
                  sceneShotList: z.array(z.string({})),
                })
              )
            ),
            systemPrompt: 'You are a show creator writing out the episode scenes',
          },
        },
      },
      {
        input: {
          id: 'episodeScenesList',
          outputType: 'infer',
          dependencies: {
            episodeScenes: {
              type: 'cellReference',
              cellId: 'episodeScenesOutput',
              forEach: true,
            },
          },
          input: {
            type: 'code',
            content: `
function run(){
  const results=[];
  for (const scene of episodeScenes) {
    for (let i = 0; i < scene.sceneShotList.length; i++) {
      const shot = scene.sceneShotList[i];
      results.push({
        sceneNumber: scene.sceneNumber,
        shotNumber: i,
        shot: shot,
      })
    }
  }
  return results;
}`,
          },
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
    assetLookup: [],
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
      },
      {
        input: {
          id: 'executeTasks',
          outputType: 'infer',
          dependencies: {
            defineTasksOutputItem: {
              type: 'cellReference',
              forEach: true,
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
      },
    ],
  };
}

type NotebookCellOutputDetails =
  | {
      hasMultipleOutputs: true;
      outputs: CellOutput[];
    }
  | {
      hasMultipleOutputs: false;
      output: CellOutput;
    };
export type NotebookCell = {
  input: CellInput;
  outputDetails?: NotebookCellOutputDetails;
};
export type Notebook = {
  cells: NotebookCell[];
  assetLookup: Array<{
    assetId: string;
    type: 'image' | 'video';
    content: string;
  }>;
  metadata: {
    title: string;
  };
};

export type CellDependencyValue =
  | {
      type: 'cellReference';
      forEach?: boolean;
      cellId: string;
    }
  | {
      type: 'outputReference';
      forEach?: boolean;
      cellId: string;
      field: string;
    };
export type CellDependencies = {
  [key: string]: CellDependencyValue;
};

export type CellInput = {
  id: string; // overwritable
  dependencies?: CellDependencies;
  outputType: 'infer' | 'markdown' | 'image' | 'webpage' | 'table' | 'reactComponent';
  input: CellTypes;
};
export type CellOutput = {
  id: string; // overwritable
  processed: boolean;
  output?: CellTypes;
  outputReferences: {[key: string]: CellTypes | undefined};
  error?: CellOutputError;
  outputMeta?: {
    type: 'aiPrompt';
    tokensIn: number;
    tokensOut: number;
    costIn: number;
    costOut: number;
  };
};
export type CellOutputError = {
  error: string;
};
export type CellTypes =
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
      resize?: {width: number; height: number};
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
      type: 'video';
      content: string;
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
      type: 'array';
      values: (CellTypes | undefined)[];
    }
  | {
      type: 'table';
      cells: string[][];
    };

export type CellDependencyValues = {[p: string]: CellTypes | undefined};
export type CellDependencyArrayValues = {[p: string]: (CellTypes | undefined)[] | undefined};

export function lookupInObject(obj: any, key: string): CellTypes | undefined {
  const keys = key.split('.');
  let current = obj;
  for (const key of keys) {
    if ('type' in current && current.type === 'json' && current.value && typeof current.value === 'string') {
      current = JSON.parse(current.value);
    }
    if (key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  if (!current) {
    return undefined;
  }
  if (current && typeof current === 'object' && 'type' in current) {
    return current;
  }
  return inferOutput(current);
}

export function processWithDependencies(content: string, dependencies: CellDependencyValues | undefined) {
  if (!dependencies) {
    return content;
  }
  // find everything between {{ and }}
  const regex = /{{(.*?)}}/g;
  let match;
  while ((match = regex.exec(content))) {
    const key = match[1];
    const dependency = lookupInObject(dependencies, key);
    if (!dependency) {
      continue;
    }
    let dependencyString = '';
    if (Array.isArray(dependency)) {
      dependencyString = dependency.map((x) => cellToString(x)).join('\n');
    } else {
      dependencyString = cellToString(dependency);
    }

    content = content.replace(`{{${key}}}`, dependencyString);
  }

  return content;
}

async function batchPromiseAll<T, T2>(
  count: number,
  array: T[],
  callback: (x: T) => Promise<T2>,
  callbackFailed: (original: T, x: PromiseRejectedResult) => T2
): Promise<T2[]> {
  const results: T2[] = [];
  for (let i = 0; i < array.length; i += count) {
    const promises = [];
    for (let j = 0; j < count; j++) {
      if (i + j < array.length) {
        promises.push(callback(array[i + j]));
      }
    }
    const settledResults = await Promise.allSettled(promises);

    for (let i1 = 0; i1 < settledResults.length; i1++) {
      const r = settledResults[i1];
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        results.push(callbackFailed(array[i + i1], r));
      }
    }
  }
  return results;
}

function* peel<T, T2>(count: number, array: T[]): Generator<T[]> {
  for (let i = 0; i < array.length; i += count) {
    yield array.slice(i, i + count);
  }
}

async function resizeImage(base64Image: string, newWidth: number, newHeight: number) {
  const img = new Image();
  img.src = base64Image;
  await new Promise((r) => (img.onload = r));
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No context');
  }
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  return canvas.toDataURL('image/jpeg');
}

export class NotebookKernel {
  onSave: (e: Notebook) => void = () => {
    return;
  };
  clearOutputs(cellId: string) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    const cell = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cell) {
      throw new Error('Cell not found');
    }
    cell.outputDetails = undefined;
    this.saveNotebook();
  }
  downloadOutputs(cellId: string) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    const cell = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cell) {
      throw new Error('Cell not found');
    }
    if (!cell.outputDetails) {
      throw new Error('Cell has no outputs');
    }
    if (cell.outputDetails.hasMultipleOutputs) {
      const zip = new JSZip();
      for (let index = 0; index < cell.outputDetails.outputs.length; index++) {
        const output = cell.outputDetails.outputs[index];
        if (!output.output) {
          continue;
        }
        if (output.output.type === 'image') {
          const base64Image = getImagePath(output.output.content, this.notebook);
          zip.file(`${output.id}-${index}.jpg`, base64Image.split('base64,')[1], {base64: true});
        } else if (output.output.type === 'video') {
          const base64Image = getImagePath(output.output.content, this.notebook);
          zip.file(`${output.id}-${index}.webm`, base64Image.split('base64,')[1], {base64: true});
        } else {
          const result = JSON.stringify(output.output, null, 2);
          zip.file(`${output.id}-${index}.json`, result);
        }
      }
      zip.generateAsync({type: 'blob'}).then((content) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'outputs.zip';
        a.click();
      });
    } else {
      const output = cell.outputDetails.output;
      if (!output.output) {
        throw new Error('Cell has no output');
      }
      if (output.output.type === 'image') {
        const a = document.createElement('a');
        a.href = getImagePath(output.output.content, this.notebook);
        a.download = output.id + '.jpg';
        a.click();
      } else if (output.output.type === 'video') {
        const a = document.createElement('a');
        a.href = getImagePath(output.output.content, this.notebook);
        a.download = output.id + '.webm';
        a.click();
      } else {
        const result = JSON.stringify(output.output, null, 2);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([result], {type: 'application/json'}));
        a.download = output.id + '.json';
        a.click();
      }
    }
  }
  addCell(name: string) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    if (this.notebook.cells.find((x) => x.input.id === name)) {
      throw new Error('Cell already exists');
    }
    this.notebook.cells.push({
      input: {
        id: name,
        outputType: 'infer',
        input: {
          content: '',
          type: 'markdown',
        },
      },
    });
    this.saveNotebook();
  }
  updateCell(cell: NotebookCell) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    const index = this.notebook.cells.findIndex((x) => x.input.id === cell.input.id);
    if (index === -1) {
      throw new Error('Cell not found');
    }
    this.notebook.cells[index] = cell;
    this.saveNotebook();
  }
  buildReferencesAbove(type: 'cellReference' | 'outputReference', cellId: string): {id: string}[] {
    if (!this.notebook) {
      return [];
    }
    const cell = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cell) {
      return [];
    }
    const index = this.notebook.cells.findIndex((x) => x.input.id === cellId);
    if (index === -1) {
      return [];
    }
    const references: {id: string}[] = [];
    if (type === 'cellReference') {
      for (let i = 0; i < index; i++) {
        references.push({id: this.notebook.cells[i].input.id});
        references.push({id: this.notebook.cells[i].input.id + 'Output'});
      }
    } else {
      for (let i = 0; i < index; i++) {
        const outputDetails = this.notebook.cells[i].outputDetails;
        if (outputDetails) {
          references.push({id: this.notebook.cells[i].input.id + 'Output'});
        }
      }
    }
    return unique(references, 'id');
  }

  buildFieldsFromOutputReference(dependentCellId: string, cellId: string): {id: string}[] {
    if (!this.notebook) {
      return [];
    }
    const cell = this.notebook.cells.find((x) => x.input.id === cellId || x.input.id + 'Output' === cellId);
    if (!cell) {
      return [];
    }
    const dependentCell = this.notebook.cells.find(
      (x) => x.input.id === dependentCellId || x.input.id + 'Output' === dependentCellId
    );
    if (!dependentCell) {
      return [];
    }
    if (!dependentCell.outputDetails) {
      return [];
    }

    const references: {id: string}[] = [];

    if (dependentCell.outputDetails.hasMultipleOutputs) {
      for (const output of dependentCell.outputDetails.outputs) {
        for (const outputReferencesKey in output.outputReferences) {
          references.push({id: outputReferencesKey});
        }
      }
    } else {
      for (const outputReferencesKey in dependentCell.outputDetails.output.outputReferences) {
        references.push({id: outputReferencesKey});
      }
    }
    return unique(references, 'id');
  }

  removeCell(cellId: string) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    this.notebook.cells = this.notebook.cells.filter((x) => x.input.id !== cellId);
    this.saveNotebook();
  }
  moveCell(cellId: string, direction: 'up' | 'down') {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    const index = this.notebook.cells.findIndex((x) => x.input.id === cellId);
    if (index === -1) {
      throw new Error('Cell not found');
    }
    if (direction === 'up' && index > 0) {
      const temp = this.notebook.cells[index - 1];
      this.notebook.cells[index - 1] = this.notebook.cells[index];
      this.notebook.cells[index] = temp;
    }
    if (direction === 'down' && index < this.notebook.cells.length - 1) {
      const temp = this.notebook.cells[index + 1];
      this.notebook.cells[index + 1] = this.notebook.cells[index];
      this.notebook.cells[index] = temp;
    }
    this.saveNotebook();
  }
  cellHasOutput(cellId: string) {
    if (!this.notebook) {
      return false;
    }
    const cell = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cell) {
      return false;
    }
    if (cell.outputDetails) {
      return true;
    }
  }
  notebook?: Notebook;
  async runCell(cellId: string, force = false) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    const cellElement = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cellElement) {
      throw new Error('Cell not found');
    }
    if (cellElement.input.id === cellId) {
      if (this.cellIsProcessed(cellElement) && !force) {
        return;
      }
      await this.runCellInput(cellElement.input, -1, (outputDetails) => {
        const cellElement = this.notebook!.cells.find((x) => x.input.id === cellId);
        if (!cellElement) {
          throw new Error('Cell not found');
        }
        cellElement.outputDetails = outputDetails;
        this.saveNotebook();
      });
    }
  }

  async rerunCellOutput(cellId: string, outputIndex: number, force = false) {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }
    const cellElement = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cellElement) {
      throw new Error('Cell not found');
    }
    if (cellElement.input.id === cellId) {
      if (!cellElement.outputDetails || !cellElement.outputDetails.hasMultipleOutputs) {
        return;
      }
      if (this.cellIsProcessed(cellElement) && !force) {
        return;
      }
      cellElement.outputDetails.outputs[outputIndex].output = {
        type: 'markdown',
        content: 'Processing...',
      };
      this.saveNotebook();

      await this.runCellInput(cellElement.input, outputIndex, (outputDetails) => {
        if (outputDetails.hasMultipleOutputs) {
          throw new Error('Output should not have multiple outputs');
        }
        const cellElement = this.notebook!.cells.find((x) => x.input.id === cellId);
        if (!cellElement) {
          throw new Error('Cell not found');
        }
        if (!cellElement.outputDetails || !cellElement.outputDetails.hasMultipleOutputs) {
          return;
        }
        cellElement.outputDetails!.outputs[outputIndex] = outputDetails.output;
        this.saveNotebook();
      });
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

  private async runCellInput(
    input: CellInput,
    onlyOutputIndex = -1,
    outputCallback: (outputDetails: NotebookCellOutputDetails) => void
  ): Promise<void> {
    const dependencyCombinations = await this.fillDependencies(input.dependencies, true);
    if (onlyOutputIndex === -1 && dependencyCombinations.length > 1) {
      const allResults: CellOutput[] = [];
      for (const peelElement of peel(5, dependencyCombinations)) {
        const startingIndex = allResults.length;
        await Promise.all(
          peelElement.map((x, index) =>
            this.processCellInput(input, x)
              .then((e) => {
                allResults[startingIndex + index] = e;
                outputCallback({
                  hasMultipleOutputs: true,
                  outputs: allResults,
                });
                return e;
              })
              .catch((ex) => {
                const output = {
                  id: input.id + 'Output',
                  processed: true,
                  error: {
                    error: ex.reason,
                  },
                  outputReferences: {},
                } as CellOutput;
                allResults[startingIndex + index] = output;
                outputCallback({
                  hasMultipleOutputs: true,
                  outputs: allResults,
                });
                return output;
              })
          )
        );
        outputCallback({
          hasMultipleOutputs: true,
          outputs: allResults,
        });
      }
    } else {
      if (onlyOutputIndex !== -1) {
        outputCallback({
          hasMultipleOutputs: false,
          output: await this.processCellInput(input, dependencyCombinations[onlyOutputIndex]),
        });
      } else {
        outputCallback({
          hasMultipleOutputs: false,
          output: await this.processCellInput(input, dependencyCombinations[0]),
        });
      }
    }
  }

  private async processCellInput(
    input: CellInput,
    dependencies: {
      [p: string]: CellTypes | undefined;
    }
  ): Promise<CellOutput> {
    const id = input.id + 'Output';
    const outputReferences = evaluateDependencies(dependencies);
    switch (input.input.type) {
      case 'number':
        return {
          id: id,
          processed: true,
          output: {
            type: 'number',
            value: input.input.value,
          },
          outputReferences,
        };
      case 'image':
        return {
          id: id,
          processed: true,
          output: {
            type: 'image',
            content: input.input.content,
          },
          outputReferences,
        };
      case 'video':
        return {
          id: id,
          processed: true,
          output: {
            type: 'video',
            content: input.input.content,
          },
          outputReferences,
        };
      case 'webpage':
        return {
          id: id,
          processed: true,
          output: {
            type: 'webpage',
            content: input.input.content,
          },
          outputReferences,
        };
      case 'table':
        return {
          id: id,
          processed: true,
          output: {
            type: 'table',
            cells: input.input.cells,
          },
          outputReferences,
        };
      case 'json':
        return {
          id: id,
          processed: true,
          output: {
            type: 'json',
            value: input.input.value,
          },
          outputReferences,
        };
      case 'array':
        return {
          id: id,
          processed: true,
          output: {
            type: 'array',
            values: input.input.values,
          },
          outputReferences,
        };
      case 'markdown':
        return {
          id: id,
          processed: true,
          output: {
            type: 'markdown',
            content: processWithDependencies(input.input.content, dependencies),
          },
          outputReferences,
        };
      case 'code': {
        const result = await runCode(this.notebook, input.input.content, dependencies, postProcessResult);
        return {
          id: id,
          processed: true,
          output: inferOutput(result),
          outputReferences,
        };
      }
      case 'aiPrompt': {
        const result = await runAI({
          prompt: processWithDependencies(input.input.prompt, dependencies),
          model: input.input.model,
          temperature: input.input.temperature ?? 0,
          systemPrompt: processWithDependencies(input.input.systemPrompt, dependencies),
          schema: input.input.schema,
        });
        if ('error' in result) {
          return {
            id: id,
            processed: true,
            error: result,
            outputReferences,
          };
        }
        return {
          id: id,
          processed: true,
          output: inferOutput(result.result),
          outputMeta: {
            type: 'aiPrompt',
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            costIn: result.costIn,
            costOut: result.costOut,
          },
          outputReferences,
        };
      }
      case 'aiImagePrompt': {
        const result = await runAIImage({
          prompt: processWithDependencies(input.input.prompt, dependencies),
          model: input.input.model,
        });
        if ('error' in result) {
          return {
            id: id,
            processed: true,
            error: result,
            outputReferences,
          };
        }
        if (input.input.resize) {
          const resized = await resizeImage(result.result, input.input.resize.width, input.input.resize.height);
          result.result = resized;
        }

        return {
          id: id,
          processed: true,
          output: {
            type: 'image',
            content: result.result,
          },
          outputMeta: {
            type: 'aiPrompt',
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            costIn: result.costIn,
            costOut: result.costOut,
          },
          outputReferences,
        };
      }

      default:
        throw unreachable(input.input);
    }
  }

  async fillDependencies(
    inputDependencies: CellDependencies | undefined,
    runProcess: boolean
  ): Promise<CellDependencyValues[]> {
    const dependencies: CellDependencyValues = {};
    const dependencyArrays: CellDependencyArrayValues = {};
    let foreachDetails:
      | {
          cellId: string;
          dependencyKey: string;
          dependencies: CellDependencies;
        }
      | undefined = undefined;
    if (inputDependencies) {
      for (const dependencyKey in inputDependencies) {
        const dependency = inputDependencies[dependencyKey];
        switch (dependency.type) {
          case 'cellReference': {
            const cell = this.notebook?.cells.find(
              (x) => x.input.id === dependency.cellId || x.input?.id + 'Output' === dependency.cellId
            );
            if (!cell) {
              throw new Error('Cell not found');
            }
            if (foreachDetails) {
              if (foreachDetails.cellId !== dependency.cellId || !dependencyArrays[foreachDetails.dependencyKey]) {
                throw new Error('Cannot have a dependency after a foreach dependency that does not depend on it');
              }
              foreachDetails.dependencies[dependencyKey] = dependency;
            }

            if (cell.input.id === dependency.cellId) {
              const result = cellToArrayOrValue(cell.input.input);
              if (!result) continue;
              if (dependency.forEach) {
                if (result.type === 'array') {
                  dependencyArrays[dependencyKey] = result.values.map((x) => x);
                } else {
                  dependencyArrays[dependencyKey] = [result.value];
                }
                foreachDetails = {
                  cellId: dependency.cellId,
                  dependencyKey: dependencyKey,
                  dependencies: {},
                };
              } else {
                dependencies[dependencyKey] = result.value;
              }
            } else {
              if (!this.cellIsProcessed(cell)) {
                if (runProcess) {
                  await this.runCell(cell.input.id);
                } else {
                  throw new Error('Cell not processed');
                }
              }
              if (!cell.outputDetails) {
                throw new Error('Cell not processed');
              }
              if (cell.outputDetails.hasMultipleOutputs) {
                const results = cell.outputDetails.outputs.map((o) => cellToArrayOrValue(o.output));
                if (results.length === 0) continue;
                if (dependency.forEach) {
                  dependencyArrays[dependencyKey] = results.map(
                    (x) =>
                      x?.value ?? {
                        type: 'json',
                        value: 'false',
                      }
                  );
                  foreachDetails = {
                    cellId: dependency.cellId,
                    dependencyKey: dependencyKey,
                    dependencies: {},
                  };
                } else {
                  dependencies[dependencyKey] = {
                    type: 'array',
                    values: results.map(
                      (x) =>
                        x?.value ?? {
                          type: 'json',
                          value: 'false',
                        }
                    ),
                  };
                }
              } else {
                const result = cellToArrayOrValue(cell.outputDetails.output?.output);
                if (!result) continue;
                if (dependency.forEach) {
                  if (result.type === 'array') {
                    dependencyArrays[dependencyKey] = result.values.map((x) => x);
                  } else {
                    dependencyArrays[dependencyKey] = [result.value];
                  }
                  foreachDetails = {
                    cellId: dependency.cellId,
                    dependencyKey: dependencyKey,
                    dependencies: {},
                  };
                } else {
                  dependencies[dependencyKey] = result.value;
                }
              }
            }
            break;
          }
          case 'outputReference': {
            const cell = this.notebook?.cells.find(
              (x) => x.input.id === dependency.cellId || x.input?.id + 'Output' === dependency.cellId
            );
            if (!cell) {
              throw new Error('Cell not found');
            }
            if (!this.cellIsProcessed(cell)) {
              if (runProcess) {
                await this.runCell(cell.input.id);
              } else {
                throw new Error('Cell not processed');
              }
            }
            if (!cell.outputDetails) {
              throw new Error('Cell not processed');
            }

            if (foreachDetails) {
              if (foreachDetails.cellId !== dependency.cellId || !dependencyArrays[foreachDetails.dependencyKey]) {
                throw new Error('Cannot have a dependency after a foreach dependency that does not depend on it');
              }
              foreachDetails.dependencies[dependencyKey] = dependency;
            }

            if (cell.outputDetails.hasMultipleOutputs) {
              if (dependency.forEach) {
                dependencyArrays[dependencyKey] = cell.outputDetails.outputs.map(
                  (o) => o.outputReferences[dependency.field]
                );
                foreachDetails = {
                  cellId: dependency.cellId,
                  dependencyKey: dependencyKey,
                  dependencies: {},
                };
              } else {
                dependencies[dependencyKey] = {
                  type: 'array',
                  values: cell.outputDetails.outputs.map((x) => x.outputReferences[dependency.field]),
                };
              }
            } else {
              if (dependency.forEach) {
                dependencyArrays[dependencyKey] = [cell.outputDetails.output!.outputReferences[dependency.field]];
                foreachDetails = {
                  cellId: dependency.cellId,
                  dependencyKey: dependencyKey,
                  dependencies: {},
                };
              } else {
                dependencies[dependencyKey] = cell.outputDetails.output!.outputReferences[dependency.field];
              }
            }
            break;
          }
          default:
            throw unreachable(dependency);
        }
      }
    }

    if (Object.keys(dependencyArrays).length > 0) {
      const dependencyCombinations: CellDependencyValues[] = [structuredClone(dependencies) as CellDependencyValues];

      for (const dependencyArraysKey of safeKeys(dependencyArrays)) {
        const dep = dependencyArrays[dependencyArraysKey];
        const newCombinations: CellDependencyValues[] = [];
        if (!dep) continue;
        for (const value of dep) {
          for (const combination of dependencyCombinations) {
            const newCombination = structuredClone(combination);
            newCombination[dependencyArraysKey] = value;
            newCombinations.push(newCombination);
          }
        }
        dependencyCombinations.splice(0, dependencyCombinations.length, ...newCombinations);
      }

      if (foreachDetails && Object.keys(foreachDetails.dependencies).length > 0) {
        const dep = dependencyArrays[foreachDetails.dependencyKey];
        if (!dep) {
          throw new Error('Dependency not found');
        }
        for (const dependenciesKey in foreachDetails.dependencies) {
          for (let i = 0; i < dependencyCombinations.length; i++) {
            const dependencyCombination = dependencyCombinations[i];
            if (dependencyCombination[dependenciesKey]?.type === 'array') {
              dependencyCombination[dependenciesKey] = dependencyCombination[dependenciesKey].values[i];
            } else {
              throw new Error('Dependency not the correct type');
            }
          }
        }
      }

      return dependencyCombinations;
    } else {
      return [dependencies];
    }
  }

  saveNotebook() {
    if (!this.notebook) {
      throw new Error('Notebook not loaded');
    }

    this.moveAssets(this.notebook);

    this.notebook = structuredClone(this.notebook);
    this.onSave(this.notebook);
  }

  private cellIsProcessed(cellElement: NotebookCell) {
    if (!cellElement.outputDetails) {
      return false;
    }
    if (cellElement.outputDetails.hasMultipleOutputs) {
      return cellElement.outputDetails.outputs.every((x) => x.processed);
    }
    return cellElement.outputDetails.output.processed;
  }

  private moveAssets(notebook: Notebook) {
    const foundAssets: string[] = [];
    for (const cell of notebook.cells) {
      if (cell.outputDetails) {
        if (cell.outputDetails.hasMultipleOutputs) {
          for (const output of cell.outputDetails.outputs) {
            if (!output) continue; // hasnt been populated yet
            const out = output.output;
            if (out?.type === 'image') {
              if (out.content.startsWith('data:image')) {
                const foundAsset = notebook.assetLookup.find((x) => x.content === out.content);
                if (foundAsset) {
                  out.content = 'asset:' + foundAsset.assetId;
                  foundAssets.push(foundAsset.assetId);
                } else {
                  const assetId = uuidv4();
                  notebook.assetLookup.push({
                    assetId: assetId,
                    type: 'image',
                    content: out.content,
                  });
                  out.content = 'asset:' + assetId;
                  foundAssets.push(assetId);
                }
              } else if (out.content.startsWith('asset:')) {
                foundAssets.push(out.content.split('asset:')[1]);
              }
            }
            if (out?.type === 'video') {
              if (out.content.startsWith('data:video')) {
                const foundAsset = notebook.assetLookup.find((x) => x.content === out.content);
                if (foundAsset) {
                  out.content = 'asset:' + foundAsset.assetId;
                  foundAssets.push(foundAsset.assetId);
                } else {
                  const assetId = uuidv4();
                  notebook.assetLookup.push({
                    assetId: assetId,
                    type: 'video',
                    content: out.content,
                  });
                  out.content = 'asset:' + assetId;
                  foundAssets.push(assetId);
                }
              } else if (out.content.startsWith('asset:')) {
                foundAssets.push(out.content.split('asset:')[1]);
              }
            }
          }
        } else {
          if (cell.outputDetails.output?.output?.type === 'image') {
            if (cell.outputDetails.output.output.content.startsWith('data:image')) {
              const content = cell.outputDetails.output.output.content;
              const foundAsset = notebook.assetLookup.find((x) => x.content === content);
              if (foundAsset) {
                cell.outputDetails.output.output.content = 'asset:' + foundAsset.assetId;
                foundAssets.push(foundAsset.assetId);
              } else {
                const assetId = uuidv4();
                notebook.assetLookup.push({
                  assetId: assetId,
                  type: 'image',
                  content: content,
                });
                cell.outputDetails.output.output.content = 'asset:' + assetId;
                foundAssets.push(assetId);
              }
            } else if (cell.outputDetails.output.output.content.startsWith('asset:')) {
              foundAssets.push(cell.outputDetails.output.output.content.split('asset:')[1]);
            }
          }
          if (cell.outputDetails.output?.output?.type === 'video') {
            if (cell.outputDetails.output.output.content.startsWith('data:video')) {
              const content = cell.outputDetails.output.output.content;
              const foundAsset = notebook.assetLookup.find((x) => x.content === content);
              if (foundAsset) {
                cell.outputDetails.output.output.content = 'asset:' + foundAsset.assetId;
                foundAssets.push(foundAsset.assetId);
              } else {
                const assetId = uuidv4();
                notebook.assetLookup.push({
                  assetId: assetId,
                  type: 'video',
                  content: content,
                });
                cell.outputDetails.output.output.content = 'asset:' + assetId;
                foundAssets.push(assetId);
              }
            } else if (cell.outputDetails.output.output.content.startsWith('asset:')) {
              foundAssets.push(cell.outputDetails.output.output.content.split('asset:')[1]);
            }
          }
        }
      }
    }
    notebook.assetLookup = notebook.assetLookup.filter((x) => foundAssets.includes(x.assetId));
  }
}

async function runCode(
  notebook: Notebook | undefined,
  content: string,
  dependencies: CellDependencyValues | undefined,
  postProcess: (result: any) => Promise<any>
) {
  const args: {key: string; value: any}[] = [];
  if (dependencies) {
    for (const key in dependencies) {
      const dependency = dependencies[key];
      if (!dependency) {
        continue;
      }
      args.push({key: key, value: parseCell(dependency)});
    }
  }
  RunUtils.instance.setNotebook(notebook);

  const result = new Function(...args.map((x) => x.key), 'Utils', content + '\n\nreturn run;')(
    ...args.map((x) => x.value),
    RunUtils.instance
  );
  let outcome = result();
  outcome = await postProcess(outcome);

  RunUtils.instance.setNotebook(undefined);

  return outcome;
}

function inferOutput(result: any): CellTypes {
  if (typeof result === 'string') {
    if (result.startsWith('data:image')) {
      return {
        type: 'image',
        content: result,
      };
    }
    if (result.startsWith('data:video')) {
      return {
        type: 'video',
        content: result,
      };
    }
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
        type: 'array',
        values: result.map((x) => inferOutput(x)),
      };
    }
    return {
      type: 'json',
      value: JSON.stringify(result),
    };
  }
  throw new Error('Could not infer output type');
}

export function unreachable(x: never): never {
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

async function runAI(input: {
  prompt: string;
  temperature: number;
  model: string;
  systemPrompt: string;
  schema?: string;
}): Promise<
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
  const wasArray = input.schema && zodSchema && 'typeName' in zodSchema._def && zodSchema._def.typeName === 'ZodArray';
  zodSchema = wasArray ? z.object({items: zodSchema}) : zodSchema;

  const schema = input.schema ? zodToJsonSchema(zodSchema) : undefined;
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

async function runAIImage(
  input: {prompt: string; model: string},
  retryCount = 0
): Promise<
  | {
      result: string;
      tokensIn: number;
      tokensOut: number;
      costIn: number;
      costOut: number;
    }
  | CellOutputError
> {
  if (retryCount > 3) {
    return {
      error: 'Failed to generate',
    };
  }
  const client = new OpenAI({fetch: fetch, apiKey: import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true});
  try {
    let startTime = Date.now();
    const result = await client.images.generate({
      // stream: true,
      model: input.model,
      response_format: 'b64_json',
      quality: 'standard',
      size: '1024x1024',
      n: 1,
      prompt: input.prompt,
    });
    if (Date.now() - startTime < 61000) {
      console.log('stalling for ', 61000 - (Date.now() - startTime), 'ms');
      await new Promise((r) => setTimeout(r, 61000 - (Date.now() - startTime)));
    }
    return {
      result: result.data[0].b64_json ? `data:image/png;base64,${result.data[0].b64_json}` : '',
      tokensIn: 0,
      tokensOut: 0,
      costIn: 0,
      costOut: 0,
    };
  } catch (ex) {
    assertType<Error & {code: string}>(ex);
    // is 429
    if (ex.code === 'rate_limit_exceeded') {
      await new Promise((r) => setTimeout(r, retryCount * 60 * 1000));
      return runAIImage(input, retryCount + 1);
    }

    console.log(ex);
    return {
      error: 'Failed to generate ' + ex.toString(),
    };
  }
}

function evaluateDependencies(dependencies: CellDependencyValues) {
  const evaluated: {[p: string]: CellTypes | undefined} = {};
  for (const key in dependencies) {
    const dependency = dependencies[key];
    evaluated[key] = dependency;
  }
  return evaluated;
}

function cellToString(cell: CellTypes | undefined): string {
  switch (cell?.type) {
    case undefined:
      return '';
    case 'markdown':
      return cell.content;
    case 'json':
      return cell.value;
    case 'array':
      return cell.values.map((x) => cellToString(x)).join('\n');
    case 'number':
      return cell.value.toString();
    case 'image':
      return `![image](${cell.content})`;
    case 'video':
      return `![video](${cell.content})`;
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
      values: (CellTypes | undefined)[];
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
    case 'array':
      return {
        type: 'array',
        value: cell,
        values: cell.values,
      };
    case 'number':
      return {
        type: 'value',
        value: cell,
      };
    case 'image':
      return {type: 'value', value: cell};
    case 'video':
      return {type: 'value', value: cell};
    case 'webpage':
      return {type: 'value', value: cell};
    case 'table':
      return {
        type: 'array',
        value: cell,
        values: cell.cells.map((x) => ({
          type: 'array',
          values: x.map((y) => ({
            type: 'markdown',
            content: y,
          })),
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
    case 'array':
      return cell.values.map((x) => parseCell(x));
    case 'number':
      return cell.value;
    case 'image':
      return cell.content;
    case 'video':
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
function safeKeys<T>(object: {[key: string]: T}) {
  return Object.keys(object) as (keyof typeof object)[];
}

function unique<T>(array: T[], field: keyof T): T[] {
  const seen = new Set<any>();
  return array.filter((item) => {
    const key = item[field];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
function assertType<T>(x: any): asserts x is T {
  return;
}

async function postProcessResult(result: any) {
  if (result instanceof Promise) {
    await result;
  }
  if (result instanceof RunUtilsImage) {
    result = await result.process();
  }
  if (result instanceof RunUtilsVideo) {
    result = await result.process();
  }
  return result;
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export function getImagePath(path: string, notebook: Notebook | undefined) {
  if (!notebook) return path;
  if (path.indexOf('asset:') === 0) {
    const assetId = path.substring(6);
    const asset = notebook.assetLookup.find((asset) => asset.assetId === assetId);
    if (asset) {
      return asset.content;
    }
  }
  return path;
}
