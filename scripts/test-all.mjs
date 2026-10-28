import {spawnSync} from 'node:child_process';
for(const file of ['scripts/test-menu.mjs','scripts/test-standalone.mjs']){const result=spawnSync(process.execPath,[file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
