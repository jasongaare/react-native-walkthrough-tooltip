// @flow
import { StyleSheet } from 'react-native';

import EStyleSheet from 'react-native-extended-stylesheet';

import { ifIphoneX, getStatusBarHeight } from 'react-native-iphone-x-helper';

const styles = EStyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    backgroundColor: 'transparent',
  },
  containerVisible: {
    opacity: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  tooltip: {
    backgroundColor: 'transparent',
    position: 'absolute',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    shadowOpacity: 0.8,
  },
  content: {
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  arrow: {
    position: 'absolute',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },

  // Custom styles
  notification:{
    position: 'absolute',
    width: '100%',
    zIndex: 1009,
  },
  notificationImage:{
    width: '100%',
    height: '80%',
  },
  notificationContainer:{
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
  },
  notificationBox:{
    position: 'absolute',
    marginTop: 40,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    justifyContent:'center',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    height: 90,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  notificationText:{  
    fontSize: 15, 
    fontFamily: 'Lato',
    height: '100%',
  },
  weightedFont:{
    fontFamily: 'Lato',
    fontWeight: '700',
  },
  closeTutorialBottom: {
    position: 'absolute',
    '@media ios': {
      ...ifIphoneX({
        bottom: getStatusBarHeight() + 15,
        left: '5%',
      }, 
      {
        bottom: 15,
        left: '5%',
      }),
    },
    '@media android': {
      bottom: 15,
      right: '5%',
    },
    zIndex: 1,
  },
  closeTutorialTop: {
    position: 'absolute',
    '@media ios': {
      left: '5%',
      ...ifIphoneX({
        top: getStatusBarHeight() + 20,
      }, 
      {
        top: 30,
      }),
    },
    '@media android': {
      right: '4.7%',
      top: 10,
    },
    zIndex: 1,
  },
});

export default styles;
