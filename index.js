const { Client } = require('discord.js-selfbot-v13');
const client = new Client();

const applicationId = '270904126974590976';

let status = 0;
let userid;
let bet = '10k'
let channel;
let preaction = ""
let count = 0;
let win = 0;
let lose = 0;
let draw = 0;
client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  userid = client.user.id;
})

client.on('messageCreate', async (message) => {
	const messageId = message.id
	if (message.author.id == userid) {
    if (message.content === 'blackjack') {
		if (status == 0) {
			channel = await client.channels.cache.get(message.channel.id)
			status = 1
			//channel.send('start blackjack');
			if (!channel) throw new Error("channel not found");
			await channel.sendSlash(applicationId, "blackjack", [bet])
		}
    }
			else if (message.content == 'stop'){
			status = 0
		}
	else if (message.content.split(' ')[0] === 'bet'){
		bet = message.content.split(' ')[1]
	}
	}
	else {
		if (message.author.id == 270904126974590976 && status == 1) {
			message = channel.messages.fetch(messageId)
			let old = message.embeds[0]['fields'][0].value;
			status = 2
			while(status == 2){
				if (count > 5) {
					status = 1;
					preaction = ""
					count = 0;
					await channel.sendSlash(applicationId, "blackjack", [bet])
					break;
				}
			
				old = message.embeds[0]['fields'][0];
				if (message.components && message.components[1].components[0]['label'] == 'Start Game') {
					//console.log('Start')
					await channel.sendSlash(applicationId, "blackjack", [bet])
				}
				else if (message.components[0].components[0]['label'].includes("Play Again")){
					//console.log("Play")
					action("Play", message)
					const color = message.embeds[0].color;
					if (color == 5025616) {
						win++
					}
					else if (color == 15022389) {
						lose++
					}
					else {
						draw++
					}
					console.clear()
					console.log(`Win: ${win}`)
					console.log(`Lose: ${lose}`)
					console.log(`Draw: ${draw}`)
					console.log(`WR: ${win / (win + lose) * 100}%`)
					
				}
				else if (message.embeds && message.embeds[0] && message.embeds[0]['fields']) {
					const dealer = getnum(message.embeds[0]['fields'][0]['value'])
					let player = getnum(message.embeds[0]['fields'][1]['value'])
					if (message.embeds[0]['fields'].length >= 3) {
						const playerindex = message.embeds[0]['fields'].findIndex(item => item.name.includes('Player'));
						player = getnum(message.embeds[0]['fields'][playerindex]['value'])
						const select = strategy(dealer, player, true, message.embeds[0]['fields'].length===4)
						//console.log(select)
						action(select, message)
					}
					else {
						const select = strategy(dealer, player)
						//console.log(select)
						action(select, message)
					}
			}
			await new Promise((resolve) => {
				const interval = setInterval(() => {
				const currentContent = message.embeds[0]['fields'][0].value;
					if (currentContent !== old) {
						clearInterval(interval);
						resolve();
					}
				}, 750);
				
				
			});
			await new Promise(resolve => setTimeout(resolve, 1150));
			}
		}
	}
});

function getnum(inputString) {
  const faceRegex = /bjFace([A-KQJ0-9]+)[^:]+/g;
  const backtickRegex = /`\s*(\d+)\s*`/g;
  const faceMapping = {
    A: 1,
    K: 13,
    Q: 12,
    J: 11
  };
  let result = [];
  let match;
  while ((match = faceRegex.exec(inputString)) !== null) {
    let faceValue = match[1];
    let transformedValue = faceValue.split('').map(char => {
      return faceMapping[char] || char;
    }).join('');
    result.push(parseInt(transformedValue));
  }
  let backtickMatches = [];
  while ((match = backtickRegex.exec(inputString)) !== null) {
	  if (result.length == 1) {
		  if (result[0] == 1) {
			  backtickMatches.push(11);
		  }
		  else {
			  backtickMatches.push(result[0]);
		  }
	  }
	  else {
    backtickMatches.push(parseInt(match[1].trim()));
	  }
  }
  return [
     result,
     backtickMatches
  ];
}


// Example usage in the action function
async function action(result, message) {
	if (preaction == result) count++
	preaction = result;
    switch(result) {
        case "Hit":
            await message.clickButton(message.components[0].components[0].customId)
            break;
        case "Stand":
            await message.clickButton(message.components[0].components[1].customId)
            break;
        case "Double":
            await message.clickButton(message.components[0].components[2].customId)
            break;
        case "Split":
            await message.clickButton(message.components[0].components[3].customId)
            break;
        case "Surrender":
            await message.clickButton(message.components[1].components[0].customId);
            break;
        case "Play":
            await message.clickButton(message.components[0].components[0].customId);
            break;
        default:
            console.log("Unknown action");
    }
}

function strategy(dealer, player, split=false, split2=false) {
    const dealerCard = dealer[0][0];
    const playerCards = player[0];
    let playerTotal = player[1][0];
	
	if (split && playerCards.length === 3) {
		return "Stand"
	}
	
	if (playerCards.length === 2 && playerCards[0] != playerCards[1]) {
		if (playerTotal === 16 && dealerCard >= 1 && dealerCard <= 9 && !split) {
			return "Surrender"
		}
		else if (playerTotal === 15 && dealerCard === 10 && !split) {
			return "Surrender"
		}
	}

    // Check if player has a pair
    if (!(split && playerCards.includes(1)) && playerCards.length === 2 && playerCards[0] === playerCards[1] && !split2) {
        const pairCard = playerCards[0];
        switch (pairCard) {
            case 1: // Pair of Aces
                return "Split";
            case 10: // Pair of Tens
                return "Stand";
            case 9:
                if (dealerCard >= 2 && dealerCard <= 9 && dealerCard !== 7) {
                    return "Split";
                } else {
                    return "Stand";
                }
            case 8:
                return "Split";
            case 7:
                if (dealerCard >= 2 && dealerCard <= 7) {
                    return "Split";
                } else {
                    return "Hit";
                }
            case 6:
                if (dealerCard >= 2 && dealerCard <= 6) {
                    return "Split";
                } else {
                    return "Hit";
                }
            case 5:
                if (dealerCard >= 2 && dealerCard <= 9) {
                    return "Double";
                } else {
                    return "Hit";
                }
            case 4:
                if (dealerCard === 5 || dealerCard === 6) {
                    return "Split";
                } else {
                    return "Hit";
                }
            case 3:
            case 2:
                if (dealerCard >= 2 && dealerCard <= 7) {
                    return "Split";
                } else {
                    return "Hit";
                }
        }
    }
    
    // Check if it's a soft total
    if (playerCards.includes(1) && player[0].length == 2) {
        const nonAceTotal = playerTotal - 1;
        switch (nonAceTotal) {
            case 9: // A,9
                return "Stand";
            case 8: // A,8
                if (dealerCard === 6) {
                    return "Double";
                } else {
                    return "Stand";
                }
            case 7: // A,7
                if (dealerCard >= 2 && dealerCard <= 6) {
                    return "Double";
                } else if (dealerCard >= 9 || dealerCard === 1) {
                    return "Hit";
                } else {
                    return "Stand";
                }
            case 6: // A,6
                if (dealerCard >= 3 && dealerCard <= 6) {
                    return "Double";
                } else {
                    return "Hit";
                }
            case 5: // A,5
                if (dealerCard >= 4 && dealerCard <= 6) {
                    return "Double";
                } else {
                    return "Hit";
                }
            case 4: // A,4
                if (dealerCard >= 4 && dealerCard <= 6) {
                    return "Double";
                } else {
                    return "Hit";
                }
            case 3: // A,3
            case 2: // A,2
                if (dealerCard >= 5 && dealerCard <= 6) {
                    return "Double";
                } else {
                    return "Hit";
                }
        }
    }

    // Hard totals
    switch (playerTotal) {
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
            return "Stand";
        case 16:
            if (dealerCard >= 2 && dealerCard <= 6) {
                return "Stand";
            } else {
                return "Hit";
            }
        case 15:
            if (dealerCard >= 2 && dealerCard <= 6) {
                return "Stand";
            } else {
                return "Hit";
            }
        case 14:
            if (dealerCard >= 2 && dealerCard <= 6) {
                return "Stand";
            } else {
                return "Hit";
            }
        case 13:
            if (dealerCard >= 2 && dealerCard <= 6) {
                return "Stand";
            } else {
                return "Hit";
            }
			
		case 12:
            if (dealerCard >= 4 && dealerCard <= 6) {
                return "Stand";
            } else {
                return "Hit";
            }
        case 11:
			if (player[0].length == 2) {
				return "Double";
			}
			else {
				return "Hit";
			}
			
        case 10:
            if (dealerCard >= 2 && dealerCard <= 9 && player[0].length == 2) {
                return "Double";
            } else {
                return "Hit";
            }
        case 9:
            if (dealerCard >= 3 && dealerCard <= 6 && player[0].length == 2) {
                return "Double";
            } else {
                return "Hit";
            }
        case 8:
        default:
            return "Hit";
    }
}


client.login('tokenhere');

process.on('uncaughtException', (err) => {
  console.error(err);
});
