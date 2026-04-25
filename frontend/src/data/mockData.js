export const defaultNodes = [
  {
    id: 'node-1',
    functionName: 'dispatch',
    filePath: 'Sources/Store.swift',
    complexity: 'O(1)',
    tags: ['async'],
    position: { x: 50, y: 200 },
    icon: 'hub',
    code: `@discardableResult
public func dispatch<T: AnySideEffect>(
  _ dispatchable: T
) -> Promise<Void> {
  let promise = Promise<Void>(in: .background) {
    resolve, reject, _ in
    self.sideEffectQueue.async {
      do {
        try Hydra.await(
          self.interceptAndPerform(dispatchable)
        )
        resolve(())
      } catch {
        reject(error)
      }
    }
  }
  return promise
}`,
    startLine: 130,
    highlightLine: 133,
    analysis: {
      description:
        'Central dispatch method for the Store. Enqueues a side effect on the concurrent sideEffectQueue, runs interceptors, then resolves a Promise.',
      dependencies: 'Hydra (Promise), sideEffectQueue, interceptors',
      returnType: 'Promise<Void>',
      executionTime: '<1ms (async)',
    },
  },
  {
    id: 'node-2',
    functionName: 'updatedState',
    filePath: 'Sources/StateUpdater.swift',
    complexity: 'O(n)',
    tags: ['mutating'],
    position: { x: 400, y: 80 },
    icon: 'sync_alt',
    code: `public protocol AnyStateUpdater: Dispatchable {
  func updatedState(
    currentState: State
  ) -> State
}

public protocol StateUpdater: AnyStateUpdater {
  associatedtype StateType: State

  func updateState(
    _ currentState: inout StateType
  )
}

extension StateUpdater {
  public func updatedState(
    currentState: State
  ) -> State {
    guard var state = currentState
      as? StateType else {
      fatalError("wrong state type")
    }
    self.updateState(&state)
    return state
  }
}`,
    startLine: 16,
    highlightLine: 23,
    analysis: {
      description:
        'Protocol that defines how to produce a new state from the current one. The Store calls updatedState after interceptors pass.',
      dependencies: 'State protocol',
      returnType: 'State',
      executionTime: 'varies',
    },
  },
  {
    id: 'node-3',
    functionName: 'sideEffect',
    filePath: 'Sources/SideEffect.swift',
    complexity: 'O(1)',
    tags: ['async', 'throws'],
    position: { x: 400, y: 340 },
    icon: 'bolt',
    code: `public protocol AnySideEffect: Dispatchable {
  func anySideEffect(
    _ context: AnySideEffectContext
  ) throws -> Void
}

public protocol SideEffect: AnySideEffect {
  associatedtype StateType: State
  associatedtype Dependencies:
    SideEffectDependencyContainer

  func sideEffect(
    _ context: SideEffectContext<
      StateType, Dependencies
    >
  ) throws -> Void
}`,
    startLine: 60,
    highlightLine: 67,
    analysis: {
      description:
        'Protocol for async side effects dispatched through the Store. Side effects can read state, dispatch other items, and access dependencies.',
      dependencies: 'SideEffectContext, SideEffectDependencyContainer',
      returnType: 'Void (throws)',
      executionTime: 'varies (async)',
    },
  },
  {
    id: 'node-4',
    functionName: 'execute',
    filePath: 'Sources/Interceptor/ObserverInterceptor.swift',
    complexity: 'O(n)',
    tags: [],
    position: { x: 750, y: 80 },
    icon: 'visibility',
    code: `public class ObserverInterceptor: StoreInterceptor {
  public static func handler(
    dispatchable: Dispatchable,
    state: State,
    dispatch: @escaping AnyDispatch,
    next: @escaping Next
  ) throws -> Void {
    try next()

    let prevState = state
    let currentState = state

    for observer in self.stateObservers {
      if let d = observer.init(
        prevState: prevState,
        currentState: currentState
      ) {
        dispatch(d)
      }
    }
  }
}`,
    startLine: 42,
    highlightLine: 48,
    analysis: {
      description:
        'Interceptor that watches for state changes and dispatches observer-created items in response. Runs after the next interceptor in the chain.',
      dependencies: 'StoreInterceptor, StateObserverDispatchable',
      returnType: 'Void (throws)',
      executionTime: '~2ms',
    },
  },
  {
    id: 'node-5',
    functionName: 'addListener',
    filePath: 'Sources/Store.swift',
    complexity: 'O(1)',
    tags: [],
    position: { x: 750, y: 340 },
    icon: 'hearing',
    code: `public func addListener(
  _ listener: @escaping StoreListener<S>
) -> StoreUnsubscribe {
  let id = UUID().uuidString
  self.listeners[id] = listener

  return { [weak self] in
    self?.listeners.removeValue(forKey: id)
  }
}`,
    startLine: 153,
    highlightLine: 155,
    analysis: {
      description:
        'Registers a closure to be called on every state change. Returns an unsubscribe closure. Listeners fire on the main queue.',
      dependencies: 'listeners dictionary',
      returnType: 'StoreUnsubscribe (() -> Void)',
      executionTime: '<1ms',
    },
  },
];

export const defaultEdges = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'normal',
    sourceHandle: 'output-top',
    targetHandle: 'input',
  },
  {
    id: 'edge-2',
    source: 'node-1',
    target: 'node-3',
    type: 'normal',
    sourceHandle: 'output-bottom',
    targetHandle: 'input',
  },
  {
    id: 'edge-3',
    source: 'node-2',
    target: 'node-4',
    type: 'if',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
  {
    id: 'edge-4',
    source: 'node-3',
    target: 'node-5',
    type: 'normal',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
];

export const defaultProject = {
  name: 'katana-swift',
  branch: 'main',
};

export const defaultFileTree = [
  {
    type: 'folder', name: '.github', children: [
      { type: 'file', name: 'PULL_REQUEST_TEMPLATE.md' },
      {
        type: 'folder', name: 'workflows', children: [
          { type: 'file', name: 'build_and_test.yml' },
        ],
      },
    ],
  },
  {
    type: 'folder', name: 'Sources', children: [
      {
        type: 'folder', name: 'Interceptor', children: [
          { type: 'file', name: 'DispatchableLogger.swift' },
          { type: 'file', name: 'Interceptor.swift' },
          { type: 'file', name: 'ObserverInterceptor.swift' },
        ],
      },
      { type: 'file', name: 'Dispatchable.swift' },
      { type: 'file', name: 'SideEffect.swift' },
      { type: 'file', name: 'SideEffectDependencyContainer.swift' },
      { type: 'file', name: 'SignpostLogger.swift' },
      { type: 'file', name: 'State.swift' },
      { type: 'file', name: 'StateUpdater.swift' },
      { type: 'file', name: 'Store.swift' },
      { type: 'file', name: 'Types.swift' },
    ],
  },
  {
    type: 'folder', name: 'Tests', children: [
      {
        type: 'folder', name: 'Mocks', children: [
          { type: 'file', name: 'Dispatchables.swift' },
          { type: 'file', name: 'State.swift' },
          { type: 'file', name: 'TestDependenciesContainer.swift' },
        ],
      },
      { type: 'file', name: 'ObserverInterceptorTests.swift' },
      { type: 'file', name: 'SideEffectTests.swift' },
      { type: 'file', name: 'StateUpdaterTests.swift' },
      { type: 'file', name: 'StoreInterceptorsTests.swift' },
      { type: 'file', name: 'StoreTests.swift' },
      { type: 'file', name: 'XCTestCase+Promise.swift' },
    ],
  },
  { type: 'file', name: '.swiftlint.yml' },
  { type: 'file', name: 'LICENSE' },
  { type: 'file', name: 'Package.swift' },
  { type: 'file', name: 'Project.swift' },
  { type: 'file', name: 'README.md' },
];
