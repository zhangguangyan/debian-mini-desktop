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
