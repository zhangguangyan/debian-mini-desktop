import axios from 'axios';

const api = axios.create({
  baseURL: 'http://your_teamcity_server_url/httpAuth/app/rest/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('your_username:your_password').toString('base64')
  }
});

function generateIdFromName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

async function createProject(name, parentProjectName = null) {
  const id = generateIdFromName(name);
  const payload = {
    name: name,
    id: id,
  };

  if (parentProjectName) {
    payload.parentProject = { id: generateIdFromName(parentProjectName) };
  }

  return api.post('projects', payload);
}

async function createBuild(buildName, projectName, templateId, params) {
  const buildId = `${generateIdFromName(projectName)}_${generateIdFromName(buildName)}`;
  const projectId = generateIdFromName(projectName);

  const payload = {
    name: buildName,
    id: buildId,
    template: {
      id: templateId
    },
    parameters: {
      property: Object.keys(params).map(key => ({
        name: key,
        value: params[key]
      }))
    }
  };

  return api.post(`projects/${projectId}/buildTypes`, payload);
}

(async () => {
  try {
    await createProject('p1');
    await createProject('deployment', 'p1');
    await createProject('infra', 'p1');

    // Create builds under deployment
    await createBuild('build1', 'deployment', 'buildTemplate', { param1: 'newValueForBuild1' });
    await createBuild('build2', 'deployment', 'buildTemplate', { param1: 'someOtherValue' });

    // Create builds under infra
    await createBuild('build1', 'infra', 'buildTemplate', { param1: 'newValueForInfraBuild1' });
    await createBuild('build2', 'infra', 'buildTemplate', { param1: 'anotherValue' });

  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
//----- Direct Traversal and Operation:
async function createProject(name, parentId) {
  // Implementation for creating a project and returning its ID.
  // This is just a placeholder and would need to be replaced with actual logic.
  console.log(`Creating project ${name} under parent ID ${parentId}`);
  return `${name}-ID`;
}

async function createBuild(name, parentId, params) {
  // Implementation for creating a build.
  // This is just a placeholder.
  console.log(`Creating build ${name} under parent ID ${parentId} with params ${JSON.stringify(params)}`);
}

async function processNode(node, parentId = null) {
  if (node.type === 'project') {
    const newProjectId = await createProject(node.name, parentId);

    if (node.children) {
      for (const child of node.children) {
        await processNode(child, newProjectId);
      }
    }
  } else if (node.type === 'build') {
    await createBuild(node.name, parentId, node.params);
  }
}

//--------- Visitor-like Pattern for JSON
class JsonVisitor {
  visitProject(node, parentId) {
    // Default behavior, can be overridden.
  }

  visitBuild(node, parentId) {
    // Default behavior, can be overridden.
  }
}

function visitNode(node, visitor, parentId = null) {
  if (node.type === 'project') {
    const newProjectId = visitor.visitProject(node, parentId);
    if (node.children) {
      for (const child of node.children) {
        visitNode(child, visitor, newProjectId);
      }
    }
  } else if (node.type === 'build') {
    visitor.visitBuild(node, parentId);
  }
}

class CreationVisitor extends JsonVisitor {
  visitProject(node, parentId) {
    // This could also be async with some modifications.
    console.log(`Creating project ${node.name} under parent ID ${parentId}`);
    return `${node.name}-ID`;
  }

  visitBuild(node, parentId) {
    console.log(`Creating build ${node.name} under parent ID ${parentId} with params ${JSON.stringify(node.params)}`);
  }
}

//---------- Formal Visitor Pattern
class ProjectElement {
  constructor(name, children) {
    this.name = name;
    this.children = children || [];
  }

  accept(visitor, parentId) {
    const newId = visitor.visitProject(this, parentId);
    this.children.forEach(child => child.accept(visitor, newId));
  }
}

class BuildElement {
  constructor(name, params) {
    this.name = name;
    this.params = params;
  }

  accept(visitor, parentId) {
    visitor.visitBuild(this, parentId);
  }
}

class CreationVisitor {
  visitProject(element, parentId) {
    console.log(`Creating project ${element.name} under parent ID ${parentId}`);
    return `${element.name}-ID`;
  }

  visitBuild(element, parentId) {
    console.log(`Creating build ${element.name} under parent ID ${parentId} with params ${JSON.stringify(element.params)}`);
  }
}

function createStructureFromJson(json) {
  if (json.type === "project") {
    const children = (json.children || []).map(childJson => createStructureFromJson(childJson));
    return new ProjectElement(json.name, children);
  } else if (json.type === "build") {
    return new BuildElement(json.name, json.params);
  }
}

// const root = new ProjectElement("RootProject", [new BuildElement("Build1", {param: "value"})]);
const root = createStructureFromJson(data)
root.accept(new CreationVisitor(), 'parentProjId');

const data = {
    "name": "p1",
    "type": "project",
    "children": [
        {
            "type": "build",
            "name": "build1",
            "params": {
                "param1": "value1",
                "param2": "value2"
            }
        },
        {
            "type": "project",
            "name": "p2"
        },
        {
            "type": "project",
            "name": "p3",
            "children": [
                {
                    "type": "build",
                    "name": "build1",
                    "params": {
                        "param1": "value1",
                        "param2": "value2"
                    }
                }
            ]
        }
    ]
};
