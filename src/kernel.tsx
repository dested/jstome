import {zodToJsonSchema} from 'zod-to-json-schema';
import OpenAI from 'openai';
import {z, ZodType} from 'zod';

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
  outputReferences: {[key: string]: string};
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

export type CellDependencyValues = {[p: string]: CellTypes | undefined};
export type CellDependencyArrayValues = {[p: string]: CellTypes[] | undefined};

export function processWithDependencies(content: string, dependencies: CellDependencyValues | undefined) {
  if (!dependencies) {
    return content;
  }
  for (const key in dependencies) {
    const dependency = dependencies[key];
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

export class NotebookKernel {
  onSave: (e: Notebook) => void = () => {
    return;
  };
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
    debugger;
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
    debugger;
    const cellElement = this.notebook.cells.find((x) => x.input.id === cellId);
    if (!cellElement) {
      throw new Error('Cell not found');
    }
    if (cellElement.input.id === cellId) {
      if (this.cellIsProcessed(cellElement) && !force) {
        return;
      }
      const outputDetails = await this.runCellInput(cellElement.input);
      cellElement.outputDetails = outputDetails;
    }
    this.saveNotebook();
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

  private async runCellInput(input: CellInput): Promise<NotebookCellOutputDetails> {
    const dependencyCombinations = await this.fillDependencies(input.dependencies, true);
    if (dependencyCombinations.length > 1) {
      return {
        hasMultipleOutputs: true,
        outputs: await Promise.all(dependencyCombinations.map((x) => this.processCellInput(input, x))),
      };
    } else {
      return {
        hasMultipleOutputs: false,
        output: await this.processCellInput(input, dependencyCombinations[0]),
      };
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
      case 'jsonArray':
        return {
          id: id,
          processed: true,
          output: {
            type: 'jsonArray',
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
        const result = await runCode(input.input.content, dependencies);
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
            error: {
              error: result.error,
            },
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
            error: {
              error: result.error,
            },
            outputReferences,
          };
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
                const results = cell.outputDetails.outputs.map((o) => cellToArrayOrValue(o.output)).filter((a) => !!a);
                if (results.length === 0) continue;
                if (dependency.forEach) {
                  dependencyArrays[dependencyKey] = results.map((x) => x.value);
                  foreachDetails = {
                    cellId: dependency.cellId,
                    dependencyKey: dependencyKey,
                    dependencies: {},
                  };
                } else {
                  dependencies[dependencyKey] = {
                    type: 'jsonArray',
                    values: results.map((x) => x.value),
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
                dependencyArrays[dependencyKey] = cell.outputDetails.outputs.map((o) => ({
                  type: 'markdown' as const,
                  content: o.outputReferences[dependency.field],
                }));
                foreachDetails = {
                  cellId: dependency.cellId,
                  dependencyKey: dependencyKey,
                  dependencies: {},
                };
              } else {
                dependencies[dependencyKey] = {
                  type: 'jsonArray',
                  values: cell.outputDetails.outputs.map((x) => x.outputReferences[dependency.field]), // not right
                };
              }
            } else {
              if (dependency.forEach) {
                dependencyArrays[dependencyKey] = [
                  {
                    type: 'markdown',
                    content: cell.outputDetails.output!.outputReferences[dependency.field],
                  },
                ];
                foreachDetails = {
                  cellId: dependency.cellId,
                  dependencyKey: dependencyKey,
                  dependencies: {},
                };
              } else {
                dependencies[dependencyKey] = {
                  type: 'markdown',
                  content: cell.outputDetails.output!.outputReferences[dependency.field], // not right
                };
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
            if (dependencyCombination[dependenciesKey]?.type === 'jsonArray') {
              // this whole jsonarray thing is way wrong
              dependencyCombination[dependenciesKey] = {
                type: 'json',
                value: dependencyCombination[dependenciesKey].values[i],
              } as CellTypes;
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
}

async function runCode(content: string, dependencies: CellDependencyValues | undefined) {
  const args: {key: string; value: any}[] = [];
  if (dependencies) {
    for (const key in dependencies) {
      const dependency = dependencies[key];
      if (!dependency) {
        continue;
      }
      switch (dependency.type) {
        case 'number':
          args.push({key: key, value: dependency.value});
          break;
        case 'markdown':
          args.push({key: key, value: dependency.content});
          break;
        case 'code':
          args.push({key: key, value: dependency.content});
          break;
        case 'aiPrompt':
          args.push({key: key, value: dependency});
          break;
        case 'aiImagePrompt':
          args.push({key: key, value: dependency});
          break;
        case 'image':
          args.push({key: key, value: dependency.content});
          break;
        case 'webpage':
          args.push({key: key, value: dependency.content});
          break;
        case 'json':
          args.push({key: key, value: JSON.parse(dependency.value)});
          break;
        case 'jsonArray':
          args.push({key: key, value: dependency.values.map((x) => JSON.parse(x))});
          break;
        case 'table':
          args.push({key: key, value: dependency.cells});
          break;
        default:
          args.push({key: key, value: dependency});
          break;
      }
    }
  }
  const result = new Function(...args.map((x) => x.key), content + '\n\nreturn run;')(...args.map((x) => x.value));

  return result();
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

async function runAIImage(input: {prompt: string; model: string}): Promise<
  | {
      result: string;
      tokensIn: number;
      tokensOut: number;
      costIn: number;
      costOut: number;
    }
  | CellOutputError
> {
  const client = new OpenAI({fetch: fetch, apiKey: import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true});

  const result = await client.images.generate({
    // stream: true,
    model: input.model,
    response_format: 'b64_json',
    quality: 'standard',
    size: '1024x1024',
    n: 1,
    prompt: input.prompt,
  });

  return {
    result: result.data[0].b64_json ?? '',
    tokensIn: 0,
    tokensOut: 0,
    costIn: 0,
    costOut: 0,
  };
}

function evaluateDependencies(dependencies: CellDependencyValues) {
  const evaluated: {[p: string]: any} = {};
  for (const key in dependencies) {
    const dependency = dependencies[key];
    evaluated[key] = JSON.stringify(parseCell(dependency)); // not right
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
function safeKeys<T>(object: {[key: string]: T}) {
  return Object.keys(object) as (keyof typeof object)[];
}

function unique<T>(array: T[], field: keyof T): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const key = item[field];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
