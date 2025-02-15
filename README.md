# OrangeLab

Private infrastructure for cloud natives.

<img src="docs/orange-lab-910-512.png" alt="Orange Lab logo" height="200"/>

## Core components

-   Pulumi (https://www.pulumi.com/) - configuration management, deployments and infrastructure as code
-   Tailscale (https://tailscale.com/) - end-to-end encrypted communication between nodes
-   K3s (https://k3s.io/) - lightweight Kubernetes cluster
-   Longhorn (https://longhorn.io/) - distributed storage

## Principles and goals

-   decentralized - uses your physical machines potentially spread out over geographical locations, minimise dependency on external services and cloud providers
-   private by default - uses Tailscale/WireGuard for end to end encrypted communication, making services public has to be explicitly defined
-   OSS - prefer open source components that can be run locally
-   automation - use Pulumi and Helm to automate most tasks and configuration
-   easy to use - no deep Kubernetes knowledge required, sensible defaults
-   offline mode - continue working (with some limitations) over local network when internet connection lost
-   lightweight - can be run on a single laptop using default configuration
-   scalable - distribute workloads across multiple machines as they become available, optional use of cloud instances for autoscaling
-   self-healing - in case of problems, the system should recover with no user intervention
-   immutable - no snowflakes, as long as there is at least one Longhorn replica available, components can be destroyed and easily recreated

# Applications

Applications are disabled by default.

All available settings can be found in `Pulumi.yaml`. More details about components in each module documentation.

[System module](docs/install-system.md) (required):

-   `longhorn` - replicated storage
-   `nvidia-gpu-operator` - NVidia GPU support
-   `tailscale-operator` - ingress support with Tailscale authentication

[Monitoring module](docs/monitoring.md):

-   `beszel` - Beszel (https://beszel.dev/) lightweight monitoring
-   `prometheus` - Prometheus/Grafana monitoring

[IoT module](docs/iot.md):

-   `home-assistant` - Home Assistant (https://www.home-assistant.io/) home automation platform

[AI module](docs/ai.md):

-   `ollama` - Ollama API (https://ollama.com/) local large language models
-   `open-webui` - Open WebUI (https://openwebui.com/) frontend
-   `automatic1111` - Automatic1111 Stable Diffusion WebUI (https://github.com/AUTOMATIC1111/stable-diffusion-webui)
-   `kubeai` - KubeAI (https://kubeai.io/) with Ollama and vLLM models over OpenAI-compatible API

# Platforms and limitations

Installation instructions assume your machines are running Bluefin (https://projectbluefin.io/) based on Fedora Silverblue unless otherwise noted.
It should run on any modern Linux distribution with Linux kernel 6.11.6+, even including Raspberry Pi.

Windows and MacOS support is limited. K3s requires Linux to run workloads using _containerd_ directly, however you could have some luck running https://k3d.io/ which uses Docker wrapper to run some containers as long as they do not use persistent storage.
Not a tested configuration but feedback welcome. The issue is Longhorn, which only runs on Linux. More info at https://github.com/k3d-io/k3d/blob/main/docs/faq/faq.md#longhorn-in-k3d

Look at System module, Longhorn section on how to disable replicated storage and use local storage only.

# Installation

## Initial cluster setup

1.  configure Pulumi and Tailscale on management node [docs/install.md](docs/install.md)
2.  install K3s server and agents [docs/install-k3s.md](docs/install-k3s.md)
3.  deploy required system components [docs/install-system.md](docs/install-system.md)

## Adding additional nodes

More details at [docs/install-k3s.md](docs/install-k3s.md)

1.  enable Tailscale on the node
2.  configure firewall rules
3.  install K3s agent
4.  assign Kubernetes node labels (storage, gpu, zone)
5.  (optional) update `Pulumi.<stack>.yaml` (f.e. increase Longhorn replica count) then `pulumi up`

## Deploying applications

After system components have been deployed, you can add any of the optional applications.

Lookup module documentation for more details [#Applications](#applications)

Services will have endpoints at `https://<service>.<tailnet>.ts.net/` by default.

```sh
# enable app
pulumi config set <app>:enabled true

# configure app-specific settings from Pulumi.yaml if needed
pulumi config set ollama:hostname ollama-api

# deploy
pulumi up
# or
pulumi up -r # --refresh Pulumi state if out of sync

# Make request to provision HTTP certificate and activate endpoint
curl https://<app>.<tsnet>.ts.net/
```

To remove an application, set the `enabled` flag to `false`. This will remove all resources associated with the app.

To keep storage around (for example downloaded ollama models) but remove all other resources, use `storageOnly`:

```sh
# Remove application including storage
pulumi config set <app>:enabled false
pulumi up

# Remove application resources but keep related storage
pulumi config set <app>:enabled true
pulumi config set <app>:storageOnly true
pulumi up
```

> Note: If HTTPS ingress connection using Tailscale is failing, try to remove the application and make sure there is no leftover entry for a service at https://login.tailscale.com/admin/machines. If so, remove it before enabling the app again.
