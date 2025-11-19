const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const testData = req.body;
    console.log('Received test data for:', testData.studentName);

    // Calculate results
    const results = calculateResults(testData);
    
    // Send to Telegram
    const telegramSent = await sendToTelegram(results);
    
    res.status(200).json({ 
      success: true, 
      message: 'Test submitted successfully',
      telegramSent: telegramSent,
      score: results.score,
      correctAnswers: results.correctCount
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

function calculateResults(testData) {
  const questions = [
    {
      question: "__________ is your name?",
      options: ["Where", "What", "When", "Why"],
      correct: 1
    },
    {
      question: "__________ is the library? It's next to the school.",
      options: ["When", "Who", "Where", "Why"],
      correct: 2
    },
    {
      question: "__________ is your teacher? Mr. Johnson is my teacher.",
      options: ["What", "Who", "Whose", "Which"],
      correct: 1
    },
    {
      question: "__________ is your birthday? It's in June.",
      options: ["Where", "When", "What", "Why"],
      correct: 1
    },
    {
      question: "__________ are you happy? Because I got a new bike!",
      options: ["Why", "Where", "When", "What"],
      correct: 0
    },
    {
      question: "__________ pencil is this? Is it Anna's?",
      options: ["Who", "When", "Whose", "Which"],
      correct: 2
    },
    {
      question: "__________ color do you like better, red or blue?",
      options: ["What", "When", "Which", "Whose"],
      correct: 2
    },
    {
      question: "__________ do you do after school? I play soccer.",
      options: ["What", "When", "Where", "Why"],
      correct: 0
    },
    {
      question: "__________ do you eat lunch? At 12:30.",
      options: ["Where", "What", "When", "Who"],
      correct: 2
    },
    {
      question: "__________ is that woman? She's my aunt.",
      options: ["Which", "Whose", "Who", "Why"],
      correct: 2
    },
    {
      question: "__________ is your favorite movie?",
      options: ["What", "Who", "Whose", "Where"],
      correct: 0
    },
    {
      question: "__________ are my keys? They are on the table.",
      options: ["When", "Where", "What", "Why"],
      correct: 1
    },
    {
      question: "__________ book is this? It's mine.",
      options: ["Who", "Whose", "Which", "Why"],
      correct: 1
    },
    {
      question: "__________ one is your brother? The boy with the red shirt.",
      options: ["What", "Who", "Whose", "Which"],
      correct: 3
    },
    {
      question: "__________ are you going to the park? Because I want to play.",
      options: ["Why", "Where", "When", "What"],
      correct: 0
    },
    {
      question: "__________ do you live? I live in London.",
      options: ["Where", "When", "What", "Why"],
      correct: 0
    },
    {
      question: "__________ is the problem? I can't find my phone.",
      options: ["When", "What", "Who", "Whose"],
      correct: 1
    },
    {
      question: "__________ is your test? On Monday.",
      options: ["Where", "When", "What", "Why"],
      correct: 1
    },
    {
      question: "__________ is that man's job? He is a chef.",
      options: ["What", "Who", "Whose", "Which"],
      correct: 0
    },
    {
      question: "__________ bag is heavier, yours or mine?",
      options: ["Who", "Which", "Whose", "Why"],
      correct: 1
    },
    {
      question: "__________ are you from? I'm from Brazil.",
      options: ["When", "Where", "What", "Who"],
      correct: 1
    },
    {
      question: "__________ is crying? The baby is crying.",
      options: ["What", "Why", "Who", "Whose"],
      correct: 2
    },
    {
      question: "__________ do you usually do on weekends? I visit my family.",
      options: ["What", "When", "Where", "Why"],
      correct: 0
    },
    {
      question: "__________ is your address?",
      options: ["What", "Where", "When", "Why"],
      correct: 0
    },
    {
      question: "__________ is your favorite singer? Taylor Swift.",
      options: ["Which", "Who", "Whose", "What"],
      correct: 1
    }
  ];

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const detailedResults = [];

  questions.forEach((question, index) => {
    const studentAnswerIndex = testData.answers[index];
    const isCorrect = studentAnswerIndex === question.correct;
    const isAnswered = studentAnswerIndex !== undefined && studentAnswerIndex !== null;
    
    if (isAnswered) {
      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }
    } else {
      unansweredCount++;
    }

    detailedResults.push({
      questionNumber: index + 1,
      question: question.question,
      studentAnswer: isAnswered ? question.options[studentAnswerIndex] : 'Not answered',
      correctAnswer: question.options[question.correct],
      status: !isAnswered ? 'Unanswered' : (isCorrect ? 'Correct' : 'Wrong'),
      isCorrect: isCorrect
    });
  });

  const totalQuestions = questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  
  // Format time
  const timeSpentFormatted = formatTime(testData.timeSpent);
  const timeLeftFormatted = formatTime(testData.timeLeft);
  
  // Format submission date
  const submissionDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return {
    studentName: testData.studentName,
    timeSpent: timeSpentFormatted,
    timeLeft: timeLeftFormatted,
    score: score,
    correctCount: correctCount,
    wrongCount: wrongCount,
    unansweredCount: unansweredCount,
    leaveCount: testData.leaveCount || 0,
    submissionDate: submissionDate,
    totalQuestions: totalQuestions,
    detailedResults: detailedResults
  };
}

function formatTime(seconds) {
  if (!seconds) return '0m 0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

async function sendToTelegram(results) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Telegram credentials not found. Skipping Telegram notification.');
    console.log('Available environment variables:', Object.keys(process.env));
    return false;
  }

  try {
    const bot = new TelegramBot(botToken);
    
    // Create performance rating
    let performance = 'Excellent';
    if (results.score >= 90) performance = '🏆 Outstanding';
    else if (results.score >= 80) performance = '🎯 Excellent';
    else if (results.score >= 70) performance = '👍 Good';
    else if (results.score >= 60) performance = '📈 Average';
    else performance = '📉 Needs Improvement';

    // Main report
    const mainReport = `🎓 ENGLISH TEST SUBMISSION

👤 Student: ${results.studentName}
⏱️ Time Spent: ${results.timeSpent}
⏰ Time Left: ${results.timeLeft}
📊 Score: ${results.correctCount}/${results.totalQuestions} (${results.score}%)
✅ Correct: ${results.correctCount}
❌ Wrong: ${results.wrongCount}
⏭️ Unanswered: ${results.unansweredCount}
🚪 Page Leaves: ${results.leaveCount}
📅 Submitted: ${results.submissionDate}

DETAILED RESULTS:
═══════════════════════════════
`;

    // Send main report
    await bot.sendMessage(chatId, mainReport);

    // Send detailed results in batches
    let batch = '';
    for (const result of results.detailedResults) {
      const statusEmoji = result.status === 'Correct' ? '✅' : (result.status === 'Wrong' ? '❌' : '⏭️');
      const line = `${statusEmoji} Question ${result.questionNumber}: ${result.question}\n   Student's Answer: ${result.studentAnswer}\n   Correct Answer: ${result.correctAnswer}\n   Status: ${result.status}\n\n`;
      
      if (batch.length + line.length > 4000) {
        await bot.sendMessage(chatId, batch);
        batch = line;
      } else {
        batch += line;
      }
    }

    // Send remaining batch
    if (batch) {
      await bot.sendMessage(chatId, batch);
    }

    // Send summary
    const summaryReport = `═══════════════════════════════
SUMMARY
🏆 Final Score: ${results.score}%
📈 Performance: ${performance}`;

    await bot.sendMessage(chatId, summaryReport);
    
    console.log('Telegram message sent successfully');
    return true;

  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
}
