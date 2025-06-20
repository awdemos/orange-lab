import * as pulumi from '@pulumi/pulumi';
import { Application } from '../application';
import { StorageType } from '../types';

export interface Automatic1111Args {
    domainName: string;
}

export class Automatic1111 extends pulumi.ComponentResource {
    app: Application;

    constructor(
        private name: string,
        args: Automatic1111Args,
        opts?: pulumi.ResourceOptions,
    ) {
        super('orangelab:ai:Automatic1111', name, args, opts);

        const config = new pulumi.Config(name);
        const cliArgs = config.require('cliArgs');

        this.app = new Application(this, name, {
            domainName: args.domainName,
            gpu: true,
        })
            .addStorage({ type: StorageType.GPU })
            .addDeployment({
                image: 'universonic/stable-diffusion-webui:full',
                commandArgs: ['--listen', '--api', '--skip-torch-cuda-test'],
                env: {
                    COMMANDLINE_ARGS: cliArgs,
                },
                port: 8080,
                runAsUser: 1000,
                volumeMounts: [
                    {
                        mountPath: '/app/stable-diffusion-webui/models',
                        subPath: 'models',
                    },
                    {
                        mountPath: '/app/stable-diffusion-webui/extensions',
                        subPath: 'extensions',
                    },
                    {
                        mountPath: '/app/stable-diffusion-webui/outputs',
                        subPath: 'outputs',
                    },
                ],
                resources: {
                    requests: { cpu: '100m', memory: '2Gi' },
                },
            });
    }
}
