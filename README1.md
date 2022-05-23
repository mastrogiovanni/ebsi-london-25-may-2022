## Preparation

1) Turn Up VPN

```
ssh-add '/home/michele/Projects/iota/ebsi-chrysalis-infra/foobar'
```

```
sshuttle -r iota@users.epic.deterlab.net 172.30.10.0/24
```

```
export KUBECONFIG='/home/michele/Projects/iota/ebsi-london/ebsi'
```

# Deploy IS

helm install is integration-services \
	--version 0.1.14 \
	--repo https://iotaledger.github.io/helm-charts \
	--set apiKey=EBSIKEY \
	--set cors.enabled=true \
	--set iotaHornetNode=http://hornet-node-api1:14265 \
	--set iotaPermaNode=http://hornet-node-api1:14265 \
	--set imageDashboard.tag=v1.0.5-pre-2 \
	--set kong.ingressController.ingressClass=is \
	--set ingress.className=is

# Expose to inside

kubectl port-forward svc/is-kong-proxy 3000:80

# Create Identity

- Access to http://localhost:3000
- Create an identity
- Download the identity

# Configure Admin identity

npm install -g @iota/is-cli
is config -k "" -g http://localhost:3000
is make-admin -i did:iota:5R1cG6hLMw92JPW2LFZMdVPLrZxvCgTpD2H8g8ZhZjJc -d is -n default

# Example DPP
(https://github.com/iotaledger/is-ict-dpp)

cd /home/michele/Projects/iota/is-experiments/ebsi-demo/dashboard
Change .env with the variables
PORT=4000 npm run dev

# Example IP
(https://github.com/iotaledger/ebsi-ip)
