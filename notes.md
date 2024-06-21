Human in the loop



```markdown

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
 - upload the episode

(each step requires user approval)

cost: 
	each dalle image is 4 cents
	100 images per episode, 6 episodes = 24$
	gpt4 cost, probably 10$
	text to speech: probably 5$
	39$

price: 80 bucks a tv show, take credit after you approve the 6 episodes
```

 







Actual notes:

A living notebook for an AI javascript project. 

- first class support for ai
  - Human in the loop ai
- Fully open source
- Shared as one giant JSON file
- excel style formulas and cell references (that auto update when you change the cell)
  - each cell keeps track of references and if it should be reran
- realtime colab
- version control
- import libraries using unpkg (!babylonjs) https://www.unpkg.com/ 
- devs can sell their notebooks
- real time repl
- embed notebook in your site
  - docusaurus plugin
- support for environment variables
- we host cloud storage and version control
- everything runs client side, provide keys for your ai 
- in output detect if its ```javascript or ```markdown or ```html and render it as such


```typescript

type Notebook = {
  cells: {
    input: CellInput;
    output: CellOutput;
  }
  metadata: {
    title: string;
  }

}

class NotebookKernal {
  runCell(cell: CellInput): CellOutput {
  }

  runBook(notebook: Notebook) {
  }
}

type CellInputFeed={
  
}

type CellInput = {
  id: string;// overwritable
  inputFeed:CellInputFeed;
  input: {
    content: string;
    type: 'markdown';
  } | {
    content: string;
    type: 'code';
    ouptputType: 'markdown' | 'image' | 'webpage' | 'table' | 'reactComponent';
  } | {
    type: 'aiPrompt';
    prompt: string;
    model: string;
    systemPrompt: string;
    schema: zod;
  }| {
    type: 'aiImagePrompt';
    prompt: string;
    model: string;
  }
}
type CellOutput = {
  id?: string;// overwritable
  processed: boolean;
  output: CellOutputTypes|CellOutputTypes[];
}

type CellOutputTypes = {
    type: 'markdown';
    content: string;
  } | {
    type: 'image';
    content: string;
  } | {
    type: 'webpage';
    content: string;
  } | {
    type:'table';
    cells: string[][];
  }


```
