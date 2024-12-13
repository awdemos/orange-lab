import * as kubernetes from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export class Longhorn extends pulumi.ComponentResource {
    constructor(name: string, args = {}, opts?: pulumi.ResourceOptions) {
        super('orangelab:storage:Longhorn', name, args, opts);

        const config = new pulumi.Config('longhorn');
        const version = config.require('version');
        const hostname = config.require('hostname');
        const replicaCount = config.getNumber('replicaCount');
        const enableMonitoring = config.requireBoolean('enableMonitoring');

        new kubernetes.helm.v3.Release(
            name,
            {
                chart: 'longhorn',
                namespace: 'longhorn-system',
                createNamespace: true,
                version,
                repositoryOpts: { repo: 'https://charts.longhorn.io' },
                values: {
                    defaultSettings: {
                        // requires "node.longhorn.io/create-default-disk=true" label on nodes
                        createDefaultDiskLabeledNodes: true,
                        defaultDataLocality: 'best-effort',
                        defaultReplicaCount: replicaCount,
                        replicaAutoBalance: 'least-effort',
                        storageOverProvisioningPercentage: 100,
                    },
                    csi: {
                        attacherReplicaCount: replicaCount,
                        provisionerReplicaCount: replicaCount,
                        resizerReplicaCount: replicaCount,
                        snapshotterReplicaCount: replicaCount,
                    },
                    longhornUI: {
                        replicas: 1,
                    },
                    persistence: {
                        defaultClassReplicaCount: replicaCount,
                        defaultDataLocality: 'best-effort',
                    },
                    ingress: {
                        enabled: true,
                        ingressClassName: 'tailscale',
                        host: hostname,
                        tls: true,
                    },
                    metrics: enableMonitoring
                        ? { serviceMonitor: { enabled: true } }
                        : undefined,
                },
            },
            { parent: this },
        );

        this.registerOutputs();
    }
}
