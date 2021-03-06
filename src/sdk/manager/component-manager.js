import ComponentFactory from './component-factory';
import { newCSSNode, layoutNode } from '../layout/index';

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

    this.addUITask(() => {
      this.instance.rootView.add(this.rootComponent.view);
    });
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

  addUITask(task) {
    this.uiTaskQueue.push(task);
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
        // write to out.png
        try {
          this.instance.draw();
        } catch(error) {
          console.error(error);
        }
      }
    }
  }

  layout() {
    let needsLayout = false;
    for (let compId in this.builtComponent) {
      if (this.builtComponent[compId].isLayoutDirty ) {
        needsLayout = true;
        break;
      }
    }

    if (!needsLayout) {
      console.log(`skip layout ${this.noTaskTickCount}th`);
      return;
    }

    console.log('start layout');

    layoutNode(this.rootCSSNode, this.rootCSSNode.style.width);

    this.rootComponent.calculateFrameWithSuperAbsolutePosition({left: 0, top: 0});
  }

  syncUITasks() {
    console.log('start syncUITasks');
    const tasks = this.uiTaskQueue;
    this.uiTaskQueue = [];
    for (let task of tasks) {
      task();
    }

    // console.log('node of nodeid 4:');
    // let node = this.instance.rootView.findOne('#4');

    // console.log(node.absolutePosition());
    // console.log(node.size());
  }

  addComponent(componentData, parentId, insertIndex) {
    const parentComponent = this.builtComponent[parentId];

    this.recursivelyAddComponent(componentData, parentComponent, insertIndex);
  }

  recursivelyAddComponent(componentData, parentComponent, insertIndex) {
    const component = this.buildComponentForData(componentData);
    const index = insertIndex === -1 ? parentComponent.childComponents.length : insertIndex;

    parentComponent.insertChildComponent(component, index);

    this.addUITask(() => {
      if (component.independentLayout) {
        const rootView = component.rootView;
        this.instance.frame.add(rootView);
        rootView.add(component.view);
      }
      parentComponent.insertSubview(component, index);
    });

    const childComponentsData = componentData.children || [];

    for (let childComponentData of childComponentsData) {
      this.recursivelyAddComponent(childComponentData, component, -1);
    }
  }

  buildComponentForData(data) {
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

    this.addUITask(() => {
      component.removeFromParentView();
    });
  }

  updateStyle(id, style) {
    const component = this.builtComponent[id];
    component.updateStyle(style);
    this.addUITask(() => {
      component.updateViewStyle(style);
    });
  }

  updateAttr(id, attr) {
    const component = this.builtComponent[id];
    component.updateAttr(attr);
    this.addUITask(() => {});
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
