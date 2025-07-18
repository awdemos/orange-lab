import * as pulumi from '@pulumi/pulumi';
import { Application } from '../application';

export interface BeszelArgs {
    domainName: string;
}

export class Beszel extends pulumi.ComponentResource {
    public readonly app: Application;

    constructor(name: string, args: BeszelArgs, opts?: pulumi.ResourceOptions) {
        super('orangelab:monitoring:Beszel', name, args, opts);

        const config = new pulumi.Config(name);
        const hubKey = config.get('hubKey');

        this.app = new Application(this, name, { domainName: args.domainName })
            .addStorage()
            .addDeployment({
                image: 'henrygd/beszel:latest',
                port: 8090,
                env: {
                    USER_CREATION: 'true',
                },
                hostNetwork: true,
                volumeMounts: [{ mountPath: '/beszel_data' }],
                resources: {
                    requests: { cpu: '5m', memory: '50Mi' },
                    limits: { memory: '200Mi' },
                },
            });

        if (hubKey) {
            this.app.addDeamonSet({
                name: 'agent',
                image: `henrygd/beszel-agent`,
                hostNetwork: true,
                env: {
                    PORT: '45876',
                    KEY: hubKey,
                },
                resources: {
                    requests: { cpu: '5m', memory: '20Mi' },
                    limits: { memory: '100Mi' },
                },
            });
        }
    }
}
