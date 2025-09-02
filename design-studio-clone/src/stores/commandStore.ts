import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CanvasElement } from '@/types/canvas';

// Command pattern interfaces
export interface Command {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  execute: () => void;
  undo: () => void;
  canMerge?: (other: Command) => boolean;
  merge?: (other: Command) => Command;
}

export interface CommandState {
  commands: Command[];
  currentIndex: number;
  maxHistorySize: number;
  isExecuting: boolean;
}

export interface CommandStore extends CommandState {
  // Command execution
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  
  // History management
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getHistoryEntry: (index: number) => Command | null;
  
  // Batch operations
  startBatch: (description: string) => string;
  endBatch: (batchId: string) => void;
  
  // Command creation helpers
  createAddElementCommand: (element: CanvasElement) => Command;
  createDeleteElementCommand: (elementId: string, element: CanvasElement) => Command;
  createUpdateElementCommand: (elementId: string, oldProps: Partial<CanvasElement>, newProps: Partial<CanvasElement>) => Command;
  createMoveElementCommand: (elementId: string, oldPosition: { x: number; y: number }, newPosition: { x: number; y: number }) => Command;
  createTransformElementCommand: (elementId: string, oldTransform: Partial<CanvasElement>, newTransform: Partial<CanvasElement>) => Command;
}

// Batch command for grouping multiple operations
export class BatchCommand implements Command {
  constructor(
    public id: string,
    public type: string,
    public description: string,
    public timestamp: number,
    public commands: Command[]
  ) {}

  execute() {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  canMerge(other: Command): boolean {
    return false; // Batch commands typically don't merge
  }
}

// Specific command implementations
export class AddElementCommand implements Command {
  constructor(
    public id: string,
    public type: string,
    public description: string,
    public timestamp: number,
    public element: CanvasElement,
    private addElement: (element: CanvasElement) => void,
    private deleteElement: (id: string) => void
  ) {}

  execute() {
    this.addElement(this.element);
  }

  undo() {
    this.deleteElement(this.element.id);
  }

  canMerge(): boolean {
    return false;
  }
}

export class DeleteElementCommand implements Command {
  constructor(
    public id: string,
    public type: string,
    public description: string,
    public timestamp: number,
    public elementId: string,
    public element: CanvasElement,
    private addElement: (element: CanvasElement) => void,
    private deleteElement: (id: string) => void
  ) {}

  execute() {
    this.deleteElement(this.elementId);
  }

  undo() {
    this.addElement(this.element);
  }

  canMerge(): boolean {
    return false;
  }
}

export class UpdateElementCommand implements Command {
  constructor(
    public id: string,
    public type: string,
    public description: string,
    public timestamp: number,
    public elementId: string,
    public oldProps: Partial<CanvasElement>,
    public newProps: Partial<CanvasElement>,
    private updateElement: (id: string, props: Partial<CanvasElement>) => void
  ) {}

  execute() {
    this.updateElement(this.elementId, this.newProps);
  }

  undo() {
    this.updateElement(this.elementId, this.oldProps);
  }

  canMerge(other: Command): boolean {
    return (
      other instanceof UpdateElementCommand &&
      other.elementId === this.elementId &&
      other.type === this.type &&
      other.timestamp - this.timestamp < 500 // 500ms window
    );
  }

  merge(other: Command): Command {
    if (!(other instanceof UpdateElementCommand) || !this.canMerge(other)) {
      return other;
    }

    return new UpdateElementCommand(
      this.id,
      this.type,
      this.description,
      other.timestamp,
      this.elementId,
      this.oldProps, // Keep original old props
      other.newProps, // Use latest new props
      this.updateElement
    );
  }
}

const generateCommandId = (): string => {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

let currentBatch: { id: string; description: string; commands: Command[] } | null = null;

export const useCommandStore = create<CommandStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      commands: [],
      currentIndex: -1,
      maxHistorySize: 100,
      isExecuting: false,

      // Command execution
      executeCommand: (command) => {
        set({ isExecuting: true });
        
        try {
          // If we're in the middle of history, remove everything after current index
          const { commands, currentIndex } = get();
          let newCommands = commands.slice(0, currentIndex + 1);
          
          // Try to merge with the last command if possible
          const lastCommand = newCommands[newCommands.length - 1];
          if (lastCommand && lastCommand.canMerge?.(command)) {
            const mergedCommand = lastCommand.merge!(command);
            newCommands[newCommands.length - 1] = mergedCommand;
          } else {
            // Add new command
            newCommands.push(command);
          }
          
          // Enforce max history size
          if (newCommands.length > get().maxHistorySize) {
            newCommands = newCommands.slice(-get().maxHistorySize);
          }
          
          // Execute the command
          command.execute();
          
          set({
            commands: newCommands,
            currentIndex: newCommands.length - 1,
            isExecuting: false,
          });
        } catch (error) {
          console.error('Command execution failed:', error);
          set({ isExecuting: false });
        }
      },

      undo: () => {
        const { commands, currentIndex } = get();
        if (currentIndex >= 0) {
          const command = commands[currentIndex];
          try {
            command.undo();
            set({ currentIndex: currentIndex - 1 });
          } catch (error) {
            console.error('Undo failed:', error);
          }
        }
      },

      redo: () => {
        const { commands, currentIndex } = get();
        if (currentIndex < commands.length - 1) {
          const command = commands[currentIndex + 1];
          try {
            command.execute();
            set({ currentIndex: currentIndex + 1 });
          } catch (error) {
            console.error('Redo failed:', error);
          }
        }
      },

      // History management
      canUndo: () => get().currentIndex >= 0,
      canRedo: () => get().currentIndex < get().commands.length - 1,

      clearHistory: () => {
        set({
          commands: [],
          currentIndex: -1,
        });
      },

      getHistoryEntry: (index) => {
        const { commands } = get();
        return commands[index] || null;
      },

      // Batch operations
      startBatch: (description) => {
        const batchId = generateCommandId();
        currentBatch = {
          id: batchId,
          description,
          commands: [],
        };
        return batchId;
      },

      endBatch: (batchId) => {
        if (currentBatch && currentBatch.id === batchId && currentBatch.commands.length > 0) {
          const batchCommand = new BatchCommand(
            currentBatch.id,
            'batch',
            currentBatch.description,
            Date.now(),
            currentBatch.commands
          );
          
          get().executeCommand(batchCommand);
          currentBatch = null;
        }
      },

      // Command creation helpers
      createAddElementCommand: (element) => {
        const command = new AddElementCommand(
          generateCommandId(),
          'add_element',
          `Add ${element.type} element`,
          Date.now(),
          element,
          (el) => {
            // Import canvas store methods
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().addElement(el);
            });
          },
          (id) => {
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().deleteElement(id);
            });
          }
        );

        if (currentBatch) {
          currentBatch.commands.push(command);
          return command;
        }

        return command;
      },

      createDeleteElementCommand: (elementId, element) => {
        const command = new DeleteElementCommand(
          generateCommandId(),
          'delete_element',
          `Delete ${element.type} element`,
          Date.now(),
          elementId,
          element,
          (el) => {
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().addElement(el);
            });
          },
          (id) => {
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().deleteElement(id);
            });
          }
        );

        if (currentBatch) {
          currentBatch.commands.push(command);
          return command;
        }

        return command;
      },

      createUpdateElementCommand: (elementId, oldProps, newProps) => {
        const command = new UpdateElementCommand(
          generateCommandId(),
          'update_element',
          'Update element properties',
          Date.now(),
          elementId,
          oldProps,
          newProps,
          (id, props) => {
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().updateElement(id, props);
            });
          }
        );

        if (currentBatch) {
          currentBatch.commands.push(command);
          return command;
        }

        return command;
      },

      createMoveElementCommand: (elementId, oldPosition, newPosition) => {
        const command = new UpdateElementCommand(
          generateCommandId(),
          'move_element',
          'Move element',
          Date.now(),
          elementId,
          oldPosition,
          newPosition,
          (id, props) => {
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().updateElement(id, props);
            });
          }
        );

        if (currentBatch) {
          currentBatch.commands.push(command);
          return command;
        }

        return command;
      },

      createTransformElementCommand: (elementId, oldTransform, newTransform) => {
        const command = new UpdateElementCommand(
          generateCommandId(),
          'transform_element',
          'Transform element',
          Date.now(),
          elementId,
          oldTransform,
          newTransform,
          (id, props) => {
            import('./canvasStore').then(({ useCanvasStore }) => {
              useCanvasStore.getState().updateElement(id, props);
            });
          }
        );

        if (currentBatch) {
          currentBatch.commands.push(command);
          return command;
        }

        return command;
      },
    }),
    {
      name: 'command-store',
    }
  )
);