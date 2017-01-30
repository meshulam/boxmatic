/*
 * Wrapper around paperjs that keeps a single global scope/ project
 */

import * as paper from 'paper';


// default Paper project was instantiated in path.js
const paperScope = paper.default;
const paperProject = new paperScope.Project();

export default paperScope

