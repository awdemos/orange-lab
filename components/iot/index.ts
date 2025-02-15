import * as pulumi from '@pulumi/pulumi';
import { rootConfig } from '../root-config';
import { HomeAssistant } from './home-assistant';

interface IoTModuleArgs {
    domainName: string;
}

export class IoTModule extends pulumi.ComponentResource {
    homeAssistant: HomeAssistant | undefined;

    constructor(
        name: string,
        args: IoTModuleArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super('orangelab:iot', name, args, opts);

        if (rootConfig.isEnabled('home-assistant')) {
            const configK3s = new pulumi.Config('k3s');
            this.homeAssistant = new HomeAssistant(
                'home-assistant',
                {
                    domainName: args.domainName,
                    trustedProxies: [
                        configK3s.require('clusterCidr'),
                        configK3s.require('serviceCidr'),
                        '127.0.0.0/8',
                    ],
                },
                { parent: this },
            );
        }
    }
}
