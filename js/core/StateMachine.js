// StateMachine.js - simple finite state machine with enter/update/exit/render hooks
export class StateMachine {
  constructor(states, initialState) {
    this.states = states;
    this.current = null;
    this.change(initialState);
  }

  change(stateName) {
    if (this.current && this.current.exit) {
      this.current.exit();
    }
    this.current = this.states[stateName];
    if (this.current.enter) {
      this.current.enter();
    }
  }

  update(dt) {
    if (this.current && this.current.update) {
      this.current.update(dt);
    }
  }

  render(ctx) {
    if (this.current && this.current.render) {
      this.current.render(ctx);
    }
  }
}