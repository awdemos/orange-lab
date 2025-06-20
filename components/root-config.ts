/* eslint-disable no-console */
import * as pulumi from '@pulumi/pulumi';

class RootConfig {
    constructor() {
        if (this.getAppConfig('longhorn', 'backupAccessKeyId')) {
            console.warn('longhorn:backupAccessKeyId is deprecated.');
        }
        if (this.getAppConfig('longhorn', 'backupAccessKeySecret')) {
            console.warn('longhorn:backupAccessKeySecret is deprecated.');
        }
        if (this.getAppConfig('longhorn', 'backupTarget')) {
            console.warn(
                'longhorn:backupTarget is deprecated. Use longhorn:backupBucket instead.',
            );
        }
    }

    public longhorn = {
        replicaCount: parseInt(this.requireAppConfig('longhorn', 'replicaCount')),
    };
    public storageClass = {
        Default: this.requireAppConfig('orangelab', 'storageClass'),
        GPU: this.requireAppConfig('orangelab', 'storageClass-gpu'),
        Large: this.requireAppConfig('orangelab', 'storageClass-large'),
    };

    public isEnabled(name: string): boolean {
        const config = new pulumi.Config(name);
        return config.getBoolean('enabled') ?? false;
    }

    public isBackupEnabled(appName: string, volumeName?: string): boolean {
        const config = new pulumi.Config(appName);
        const volumePrefix = volumeName ? `${volumeName}/` : '';
        const appSetting = config.getBoolean(`${volumePrefix}backupVolume`);
        return (
            appSetting ??
            new pulumi.Config('longhorn').getBoolean('backupAllVolumes') ??
            false
        );
    }

    public enableMonitoring() {
        const config = new pulumi.Config('prometheus');
        const prometheusEnabled = config.requireBoolean('enabled');
        const componentsEnabled = config.requireBoolean('enableComponentMonitoring');
        return prometheusEnabled && componentsEnabled;
    }

    private getAppConfig(appName: string, key: string): string | undefined {
        const config = new pulumi.Config(appName);
        return config.get(key);
    }

    private requireAppConfig(appName: string, key: string): string {
        const config = new pulumi.Config(appName);
        return config.require(key);
    }
}

export const rootConfig = new RootConfig();
