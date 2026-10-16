import { EndgameChallenge } from '../types/chess';

export const ENDGAME_CHALLENGES: EndgameChallenge[] = [
  {
    id: 'horse_vs_advisor',
    title: '马擒单士',
    difficulty: 'easy',
    description: '红方一马一帅，黑方孤将一士。红方运用马跳八面、以帅控中，擒拿单士致胜。',
    fen: '4k4/4a4/9/9/9/9/9/4N4/9/4K4 w',
    turn: 'red',
    targetObjective: '三步内运用借帅助威，吃掉黑士并绝杀黑将。',
  },
  {
    id: 'double_chariot_crush',
    title: '双车双杀',
    difficulty: 'medium',
    description: '红方双车抢占要道，黑方九宫防守看似严密但露空隙，红方下二路双车抽将。',
    fen: '3ak4/4a4/9/9/9/9/9/1R7/4R4/4K4 w',
    turn: 'red',
    targetObjective: '双车连环下底，迫使黑方退士，直捣黄龙。',
  },
  {
    id: 'cannon_chariot_combo',
    title: '车炮夹攻',
    difficulty: 'medium',
    description: '经典实战残局：红方一车一炮占领中肋，配合底线突破完成经典夹车炮杀法。',
    fen: '3akab2/9/4b4/9/9/2R6/9/4C4/9/4K4 w',
    turn: 'red',
    targetObjective: '利用炮架抽将破象，以车点杀。',
  },
  {
    id: 'horse_cannon_cooperation',
    title: '马后炮绝杀',
    difficulty: 'hard',
    description: '象棋最著名传统杀招“马后炮”：以马控制黑将活动范围，炮居马后一击毙命。',
    fen: '3k5/4a4/4N4/9/9/9/9/4C4/9/4K4 w',
    turn: 'red',
    targetObjective: '找准炮位与马的呼应点，达成不可防范的马后炮杀势。',
  },
];
