import ComponentFactory from './component-factory';
import { newCSSNode, layoutNode } from '../layout/index';
import { requestIdleCallback, cancelIdleCallback } from '../utils/request-idle-callback';

export default class ComponentManager {
  constructor(instance) {
    this.instance = instance;
    this.rootComponent = null;
    this.rootCSSNode = null;
    this.builtComponent = {};

    this.uiTaskQueue = [];
    this.noTaskTickCount = 0;

    this.displayLink = null;
    this.startDisplayLink();
  }

  createRoot(data) {
    this.rootComponent = this.buildComponentForData(data);
    this.initRootCSSNode();
  }

  initRootCSSNode() {
    this.rootCSSNode = newCSSNode();
    this.applyRootFrame(this.instance.frame, this.rootCSSNode);

    this.rootCSSNode.context = this;
    this.rootCSSNode.childCount = 1;
    this.rootCSSNode.isDirty = ComponentManager.rootNodeIsDirty;
    this.rootCSSNode.getChild = ComponentManager.rootNodeGetChild;
  }

  applyRootFrame(rootFrame, rootCSSNode) {
    rootCSSNode.style.left = 0;
    rootCSSNode.style.top = 0;

    rootCSSNode.style.width = rootFrame.width;
    rootCSSNode.style.height = rootFrame.height;
  }

  startDisplayLink() {
    this.displayLink = setTimeout(() => {
      this.startDisplayLink();
      this.handleDisplayLink();
    }, 50);
  }

  suspendDisplayLink() {
    clearTimeout(this.displayLink);
  }

  handleDisplayLink() {
    this.layoutAndSyncUI();
  }

  layoutAndSyncUI() {
    this.layout();
    if (this.uiTaskQueue.length) {
      this.syncUITasks();
      this.noTaskTickCount = 0;
    } else {
      this.noTaskTickCount ++;
      if (this.noTaskTickCount > 60) {
        this.suspendDisplayLink();
      }
    }
  }

  layout() {
    console.log('start layout');
    layoutNode(this.rootCSSNode, this.rootCSSNode.style.width);

    this.rootComponent.calculateFrameWithSuperAbsolutePosition({left: 0, top: 0});
  }

  syncUITasks() {
    const tasks = this.uiTaskQueue;
    this.uiTaskQueue = [];
    for (let task of tasks) {
      task();
    }
    
  }

  addComponent(componentData, parentId, insertIndex) {
    const parentComponent = this.builtComponent[parentId];

    this.recursivelyAddComponent(componentData, parentComponent, insertIndex);
  }

  recursivelyAddComponent(componentData, parentComponent, insertIndex) {
    const component = this.buildComponentForData(componentData);
    const index = insertIndex === -1 ? parentComponent.childComponents.length : insertIndex;

    parentComponent.insertChildComponent(component, index);

    const childComponentsData = componentData.children || [];

    for (let childComponentData of childComponentsData) {
      this.recursivelyAddComponent(childComponentData, component, -1);
    }
  }

  buildComponentForData(data) {
    // console.log('buildComponentForData received:');
    // console.log(data);
    // console.log('---');
    const { type, id } = data;
    const Clazz = ComponentFactory.classWithComponentName(type);

    const component = new Clazz(data);

    this.builtComponent[id] = component;

    return component;
  }

  removeComponent(id) {
    const component = this.builtComponent[id];

    component.removeFromParentComponent();
    delete this.builtComponent[id];

    // todo: relayout
  }
}

ComponentManager.rootNodeIsDirty = function(context) {
  return context.rootComponent.isLayoutDirty;
}

ComponentManager.rootNodeGetChild = function(context, index) {
  if (index === 0) {
    return context.rootComponent.cssNode;
  }
  return null;
}
