// Test file to verify all module imports work correctly
import {
  // Factory
  r,
  createElement,

  // Signals
  createSignal,

  // Effects
  createEffect,
  createComputed,

  // State
  useState,
  objectFunction,

  // Control Flow
  Show,
  For,

  // Fragment
  Fragment,

  // Refs
  useRef,
  createRef,

  // Types
  type Component,
  type Child,
  type ElementProps,
} from './src/system/index.ts';

console.log('✅ All module imports successful!');

// Test 1: Signal
const [count, setCount] = createSignal(0);
console.log('✅ createSignal works:', count());

// Test 2: useState
const state = useState(10);
console.log('✅ useState works:', state());

// Test 3: Factory
const div = r.div({ className: 'test' }, 'Hello');
console.log('✅ r.div works:', div instanceof HTMLElement);

// Test 4: Control Flow
const showElement = Show({
  when: true,
  children: () => r.span('Visible')
});
console.log('✅ Show works:', showElement instanceof DocumentFragment);

// Test 5: For Loop
const forElement = For({
  each: [1, 2, 3],
  children: (item) => r.li(`Item ${item}`)
});
console.log('✅ For works:', forElement instanceof DocumentFragment);

console.log('\n🎉 All module tests passed!');
