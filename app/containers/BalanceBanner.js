import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import glob from 'glob';
import { traduction } from '../lang/lang';
const config = require('../../config');
const request = require('request-promise-native');
const fs = require('fs');
const event = require('../utils/eventhandler');
const lang = traduction();

export default class BalanceBanner extends Component {
  constructor(props) {
    super(props);
    this.state  = {
      balance: 0,
      unconfirmed: 0,
      stake: 0,
    };
    this.getWalletInfo = this.getWalletInfo.bind(this);
  }

  componentDidMount() {
    this.setTimerFunctions();
  }
  componentWillUnmount() {
    clearInterval(this.timerInfo);
  }


  setTimerFunctions() {
    const self = this;
    self.timerInfo = setInterval(() => {
      self.getWalletInfo();
    }, 5000);
  }

  getWalletInfo() {
    var results = this.props.getStateValues('balance', 'stake', 'unconfirmed');
    const newState = {};
    for ( let key in results ) {
      //console.log(key, results[key]);
      newState[key] = results[key];
    }
    this.setState(newState);
  }

  render() {
    return (
      <div className="balance-banner">
        <div className="panel panel-default">
          <div className="panel-body">
            <div className="balance-container">
              <p className="subtitle">{lang.overviewMyBalance}:</p>
              <p className="borderBot">
                <span className="desc">{this.state.balance}</span>
                <span className="desc2"> {config.coinTicker}</span>
              </p>
            </div>
            <div className="stake-container">
              <p className="subtitle">{lang.overviewMyStaking}:</p>
              <p className="borderBot">
                <span className="desc">{this.state.stake}</span>
                <span className="desc2"> {config.coinTicker}</span>
              </p>
            </div>
            <div className="unconfirmed-container">
              <p className="subtitle">{lang.overviewMyUnconfirmed}:</p>
              <p className="borderBot">
                <span className="desc">{this.state.unconfirmed}</span>
                <span className="desc2"> {config.coinTicker}</span>
              </p>
            </div>
            <div className="total-container">
              <p className="subtitle">{lang.overviewTotal}:</p>
              <p className="borderBot">
                <span className="desc">{this.state.stake + this.state.balance + this.state.unconfirmed}</span>
                <span className="desc2"> {config.coinTicker}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
