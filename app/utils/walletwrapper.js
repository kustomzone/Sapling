import React, { Component } from 'react';
import Wallet from './wallet';
const wallet = new Wallet();
const event = require('../utils/eventhandler');
import glob from 'glob';
const homedir = require('os').homedir();

export default class WalletWrapper extends Component {
    constructor(props) {
        super(props);
        this.state = {
		  off: true,
          starting: false,
          running: false,
          stopping: false,
          walletInstalled: false,
          newVersionAvailable: false,

          //getblockchaininfo
          chain: "",
          bestblockhash: "",

          //getinfo
          version: 0,
          protocolversion: 0,
          walletversion: 0,
          balance: 0,
          newmint: 0,
          stake:0,
          blocks: 0,
          headers: 0,
          connections: 0,
          difficulty: 0,
          encrypted: false,
          unlocked_until: 0,
          staking: false,

          //getwalletinfo
          unconfirmed: 0,
          immature: 0,
        };
        this.getStateValues = this.getStateValues.bind(this);
        this.evaluateStatus = this.evaluateStatus.bind(this);
        this.updateWalletStatus = this.updateWalletStatus.bind(this);
        this.getInfo = this.getInfo.bind(this);
        this.getBlockchainInfo = this.getBlockchainInfo.bind(this);
        this.getWalletInfo = this.getWalletInfo.bind(this);
        this.startStopWalletHandler = this.startStopWalletHandler.bind(this);
        this.startWallet = this.startWallet.bind(this);
        this.stopWallet = this.stopWallet.bind(this);
    }

    componentDidMount() {
        this.updateWalletStatus();
        this.timerUpdate = setInterval(() => {
            this.updateWalletStatus();
        }, 3000);
    }

    componentWillUnmount() {
        clearInterval(this.timerUpdate);
    }

    getStateValues()
    {
        let results = {};
        for(let i = 0; i < arguments.length; i++)
        {
            //console.log("checking for arg " + arguments[i]);
            if(this.state[arguments[i]] !== undefined)
            {
                results[arguments[i]] = this.state[arguments[i]];
            }
        }
        return results;
    }

    processError(err) {
        console.log(err);
        if(err.message === 'connect ECONNREFUSED 127.0.0.1:19119'){
            this.setState({
                starting: false,
                running: false,
                stopping: false,
                off: true,
            });
        }
        else if(err.message.includes("Loading block index")){
            this.setState({ 
                starting: true,
                running: false,
                stopping: false,
                off: false,
            });
        }
        else{
            event.emit('animate', err.message);
        }
    }

    getBlockchainInfo() {
//        wallet.getBlockchainInfo().then((data) => {
//            this.setState({
//                chain: data.chain,
//                bestblockhash: data.bestblockhash,
//            });
//        }).catch((err) => {
//           this.processError(err);
//        });
    }

    getInfo() {
        wallet.getInfo().then((data) => {
            this.setState({
                version: data.version,
                protocolversion: data.protocolversion,
                walletversion: data.walletversion,
                balance: data.balance,
                newmint: data.newmint,
                stake: data.stake,
                blocks: data.blocks,
                headers: data.headers,
                connections: data.connections,
                difficulty: data.difficulty,
                encrypted: data.encrypted,
                staking: data.staking,
            });
            if(data.encrypted){
                this.setState({
                    unlocked_until: data.unlocked_until,
                });
            }
        }).catch((err) => {
            this.processError(err);
        });
    }


    getWalletInfo() {
//        wallet.getWalletInfo().then((data) => {
//            this.setState({
//                unconfirmed: data.unconfirmed_balance,
//                immature: data.immature_balance,
//            });
//        }).catch((err) => {
//            this.processError(err);
//        });
    }

    evaluateStatus(){
        // check to see if it is running if it is running
        if(this.state.walletInstalled){
            wallet.getInfo().then((data) => {
                this.setState({
                    starting: false,
                    running: true,
                    stopping: false,
                    off: false,
                });
            }).catch((err) => {
                this.processError(err); // if its not running, this will set the state
            });
        }
        else{
            // no wallet is installed so it must be off
            this.setState({
                starting: false,
                running: false,
                stopping: false,
                off: true,
            });
        }
    }

    updateWalletStatus() {
		if(this.state.off){
            event.emit('hide');
            // check to see if the wallet is downloaded
            glob(`${homedir}/.eccoin-wallet/Eccoind*`, (error, files) => {
                if (!files.length) {
                    this.setState({
                        walletInstalled: false,
                    });
                } else if (files.length) {
                    this.setState({
                        walletInstalled: true,
                    });
                } else {
                    event.emit('show', err.message);
                }
            });
            // check to see if it is running if it is running
			this.evaluateStatus();
		}
        else if (this.state.starting) {
            event.emit('show', "The wallet is starting, this may take a few minutes");
            this.evaluateStatus();
        }
		else if(this.state.running){
            event.emit('hide');
            this.getBlockchainInfo();
            this.getInfo();
            this.getWalletInfo();
		}
		else if(this.state.stopping){
			event.emit('show', "The wallet is saving data and stopping");
            this.evaluateStatus();
		} 
    }

    startStopWalletHandler() {
        // we can only start the wallet if it is currently off
        if(this.state.off){
            this.startWallet();
        }
        // we can only stop the wallet if it is running
        else if(this.state.running){
            this.stopWallet();
        }
		else{
            event.emit('animate', "wallet is either starting or stopping, please wait for it to finish before trying to turn it off or on again");
        }
    }

    startWallet() {
        wallet.walletstart((result) => {
            if (result) {
                this.setState({
                    starting: true,
                    running: false,
                    stopping: false,
                    off: true,
                });
                event.emit('show', "Starting wallet...");
            }
            else {
                this.setState({
                    starting: false,
                    running: false,
                    stopping: false,
                    off: true,
                });
                if(this.state.walletInstalled == false){
                    event.emit('show', 'Could not start wallet. Is it in the correct directory?');
                }
            }
        });
    }

    stopWallet() {
        if (process.platform.indexOf('win') > -1) {
            event.emit('animate', 'Stopping wallet...');
        }
        wallet.walletstop().then(() => {
            this.setState({
                starting: false,
                running: false,
                stopping: true,
                off: false,
            });
        })
        .catch(err => {
            this.processError(err);
        });
    }

    render() {
      const { children } = this.props;

      const childrenWithProps = React.Children.map(children, child => {
        return React.cloneElement(child, {
          startStopWalletHandler: this.startStopWalletHandler,
          getStateValues: this.getStateValues,
        });
      });

      return <div>{childrenWithProps}</div>;
    }

}
