# Demo 2

Showcase how a private tangle is started

## Install Helm

```
wget https://get.helm.sh/helm-v3.9.0-darwin-arm64.tar.gz
tar -xvzf helm-v3.9.0-darwin-arm64.tar.gz
sudo mv darwin-arm64/helm /usr/local/bin
```

## Run Minikube

```
minikube start --nodes 1 --memory 24576 --cpus 6
```

## Run Private Tangle

```
git clone git@github.com:iotaledger/iota-operator.git
helm install iota-operator iota-operator/charts/iota-operator
kubectl apply -f iota-operator/examples/coordinator.yaml
kubectl apply -f iota-operator/examples/node-1.yaml
```