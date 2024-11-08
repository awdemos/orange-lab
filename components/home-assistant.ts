import * as kubernetes from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export interface HomeAssistantArgs {
    trustedProxies?: string[];
}

export class HomeAssistant extends pulumi.ComponentResource {
    constructor(
        name: string,
        args: HomeAssistantArgs = {},
        opts?: pulumi.ResourceOptions,
    ) {
        super('orangelab:apps:HomeAssistant', name, args, opts);

        const config = new pulumi.Config('home-assistant');
        const version = config.require('version');
        const hostname = config.require('hostname');
        const zone = config.get('zone');

        // https://artifacthub.io/packages/helm/helm-hass/home-assistant
        new kubernetes.helm.v3.Release(
            name,
            {
                chart: 'home-assistant',
                namespace: 'home-assistant',
                createNamespace: true,
                version,
                repositoryOpts: {
                    repo: 'http://pajikos.github.io/home-assistant-helm-chart/',
                },
                values: {
                    affinity: zone
                        ? {
                              nodeAffinity: {
                                  requiredDuringSchedulingIgnoredDuringExecution: {
                                      nodeSelectorTerms: [
                                          {
                                              matchExpressions: [
                                                  {
                                                      key: 'orangelab/zone',
                                                      operator: 'In',
                                                      values: [zone],
                                                  },
                                              ],
                                          },
                                      ],
                                  },
                              },
                          }
                        : undefined,
                    hostNetwork: true,
                    ingress: {
                        enabled: true,
                        className: 'tailscale',
                        hosts: [
                            {
                                host: hostname,
                                paths: [
                                    {
                                        path: '/',
                                        pathType: 'ImplementationSpecific',
                                    },
                                ],
                            },
                        ],
                        tls: [{ hosts: [hostname] }],
                    },
                    configuration: {
                        enabled: true,
                        trusted_proxies: args.trustedProxies ?? [],
                    },
                    persistence: {
                        enabled: true,
                        accessMode: 'ReadWriteOnce',
                        size: '5Gi',
                    },
                },
            },
            { parent: this },
        );

        this.registerOutputs();
    }
}
