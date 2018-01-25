import React, { Component } from 'react';
import TransactionTable from './Transactions/TransactionTable';
import Wallet from '../utils/wallet';
import { traduction } from '../lang/lang';
import glob from 'glob';
const event = require('../utils/eventhandler');
const lang = traduction();
const wallet = new Wallet();

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      select: 'all',
      dialog: false,
      timeL: '',
      passPhrase: '',
      passPhraseError: '',
      locked: true,
      staking: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.changeWalletState = this.changeWalletState.bind(this);
    this.cancelDialog = this.cancelDialog.bind(this);
    this.confirmDialog = this.confirmDialog.bind(this);
    this.onPassPhraseChange = this.onPassPhraseChange.bind(this);
    this.onTimeLChange = this.onTimeLChange.bind(this);
  }

  handleChange(event) {
    this.setState({ select: event.target.value });
  }

  onPassPhraseChange(event) {
    this.setState({ passPhrase: event.target.value });
  }

  onTimeLChange(event) {
    this.setState({ timeL: event.target.value });
  }

  changeWalletState() {
    this.setState(() => {
      return { dialog: true };
    });
  }

  componentDidMount() {
    this.setState({ requestingLockState: true });
    this.setTimerFunctions();
  }
  componentWillUnmount() {
    this.state.requestingLockState = false;
    clearInterval(this.timerInfo);
  }

  setTimerFunctions() {
    const self = this;
    self.timerInfo = setInterval(() => {
      if (!self.state.requestingLockState) {
        self.getWalletInfo();
      }
    }, 5000);
  }

  getLockedState() {
    const self = this;
    this.setState({ requestingLockState: true });
    wallet.getInfo().then((data) => {
      if(self.state.requestingLockState){
        let locked = true;
        if (data.unlocked_until !== 0) {
          locked = false;
        }
        self.setState({
          locked,
          staking: data.staking,
          reuqestingLockState: false,
        });
      }
      event.emit('hide');
    }).catch((err) => {
      if(self.state.requestingLockState && err.message !== 'Method not found') {
        if (err.message !== 'Loading block index...' && err.message !== 'connect ECONNREFUSED 127.0.0.1:19119') {
          event.emit('animate', err.message);
        }
        self.setState({
          locked: true,
          requestingLockState: false,
        });
      }
    });
  }

  renderDialogBody() {
    if (this.state.locked) {
      return (
        <div>
          <div className="header">
            <p className="title">{lang.overviewModalAuthTitle}</p>
          </div>
          <div className="body">
            <p className="desc">{lang.ovweviewModalAuthDesc}</p>
            <div className="row">
              <div className="col-md-10 col-md-offset-1 input-group">
                <input className="form-control inpuText" type="password" value={this.state.passPhrase} onChange={this.onPassPhraseChange} placeholder={lang.walletPassPhrase} />
              </div>
              <div className="col-md-10 col-md-offset-1 input-group" style={{ marginTop: '15px' }}>
                <input className="form-control inpuText" type="number" value={this.state.timeL} onChange={this.onTimeLChange} placeholder={lang.secondsUnlocked} />
              </div>
              <p className="passPhraseError">{this.state.passPhraseError}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <div className="header">
            <p className="title">{lang.popupMessageConfirmationRequired}</p>
          </div>
          <div className="body">
            <p className="desc">{lang.ovweviewModalLockQuestion}</p>
          </div>
        </div>
      );
    }
  }

  renderDialog() {
    if (!this.state.dialog) {
      return null;
    } else {
      return (
        <div className="mancha">
          <div className="dialog">
            {this.renderDialogBody()}
            <div className="footer">
              <p className="button btn_cancel" onClick={this.cancelDialog}>{lang.cancel}</p>
              <p className="button btn_confirm" onClick={this.confirmDialog}>{lang.confirm}</p>
            </div>
          </div>
        </div>
      );
    }
  }

  cancelDialog() {
    this.setState({ dialog: false, passPhraseError: '', passPhrase: '', timeL: '' });
  }

  confirmDialog() {
    const self = this;
    if (this.state.locked) {
      const passPhrase = this.state.passPhrase;
      const timeL = this.state.timeL;

      if (passPhrase.length === 0 || timeL.length === 0 || timeL < 0) {
        self.setState({ passPhraseError: lang.invalidFields });
      } else {
        wallet.walletpassphrase(passPhrase, timeL).then((data) => {
          if (data !== null && data.code === -14) {
            self.setState({ passPhraseError: lang.walletWrongPass });
          } else if (data !== null && data.code === 'ECONNREFUSED') {
            event.emit('show', lang.notificationWalletDownOrSyncing);
            self.setState({ dialog: false, passPhraseError: '', passPhrase: '', timeL: '' });
          } else if (data === null) {
            event.emit('animate', `${lang.walletUnlockedFor} ${timeL} ${lang.sedonds}`);
            self.setState({dialog: false, passPhraseError: '', passPhrase: '', timeL: '' });
          } else {
            event.emit('show', lang.notificationWalletDownOrSyncing);
            self.setState({ dialog: false, passPhraseError: '', passPhrase: '', timeL: '' });
          }
        }).catch((err) => {
          console.log(err);
          self.setState({ passPhraseError: lang.walletUnlockError });
        });
      }
    } else {
      wallet.walletlock().then((data) => {
        if (data === null) {
          event.emit('animate', lang.walletLocked);
        } else {
          event.emit('animate', lang.walletLockedError);
        }
      }).catch((err) => {
        console.log(err);
        event.emit('animate', lang.walletLockedError);
      });
      self.setState({ dialog: false, passPhraseError: '', passPhrase: '', timeL: '' });
    }
  }

  render() {
    let pad = require('../../resources/images/padclose.png');
    if (!this.state.locked) {
      pad = require('../../resources/images/padopen.png');
    }
    return (
      <div className="home">
        <div className="row">
          <div className="col-md-12 ">
            <div className="panel panel-default transaction-container">
              <div className="panel-body">
                <div>
                  <p className="title">{lang.overviewMyWallet}</p>
                  <img className="padicon" src={pad} onClick={this.changeWalletState} />
                </div>
                <p className="title">{lang.overviewMyLatest100Transactions}</p>
                <div className="selectfield">
                  <select
                    className="form-control"
                    value={this.state.select}
                    onChange={this.handleChange}
                  >
                    <option value="all">{lang.all}</option>
                    <option value="send">{lang.send}</option>
                    <option value="receive">{lang.received}</option>
                    <option value="generate">{lang.staked}</option>
                    <option value={0}>{lang.pending}</option>
                    <option value={1}>{lang.confirmed}</option>
                    <option value={-1}>{lang.orphaned}</option>
                  </select>
                </div>
                <TransactionTable h={'250px'} option={this.state.select} countTras={100} />
              </div>
            </div>
          </div>
        </div>
        {this.renderDialog()}
      </div>
    );
  }
}
