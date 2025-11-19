const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const testData = req.body;
    
    // Calculate results
    const results = calculateResults(testData);
    
    // Try to send to Telegram (but don't fail if it doesn't work)
    let telegramSent = false;
    try {
      telegramSent = await sendToTelegram(results);
    } catch (telegramError) {
      console.log('Telegram failed but continuing:', telegramError.message);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Test submitted successfully!',
      telegramSent: telegramSent,
      score: results.score,
      correctAnswers: results.correctCount
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      success: true, 
      message: 'Test submitted (but some features may not work)',
      error: error.message
    });
  }
};

function calculateResults(testData) {
  const questions = [
    { question: "__________ is your name?", options: ["Where", "What", "When", "Why"], correct: 1 },
    { question: "__________ is the library? It's next to the school.", options: ["When", "Who", "Where", "Why"], correct: 2 },
    { question: "__________ is your teacher? Mr. Johnson is my teacher.", options: ["What", "Who", "Whose", "Which"], correct: 1 },
    { question: "__________ is your birthday? It's in June.", options: ["Where", "When", "What", "Why"], correct: 1 },
    { question: "__________ are you happy? Because I got a new bike!", options: ["Why", "Where", "When", "What"], correct: 0 },
    { question: "__________ pencil is this? Is it Anna's?", options: ["Who", "When", "Whose", "Which"], correct: 2 },
    { question: "__________ color do you like better, red or blue?", options: ["What", "When", "Which", "Whose"], correct: 2 },
    { question: "__________ do you do after school? I play soccer.", options: ["What", "When", "Where", "Why"], correct: 0 },
    { question: "__________ do you eat lunch? At 12:30.", options: ["Where", "What", "When", "Who"], correct: 2 },
    { question: "__________ is that woman? She's my aunt.", options: ["Which", "Whose", "Who", "Why"], correct: 2 },
    { question: "__________ is your favorite movie?", options: ["What", "Who", "Whose", "Where"], correct: 0 },
    { question: "__________ are my keys? They are on the table.", options: ["When", "Where", "What", "Why"], correct: 1 },
    { question: "__________ book is this? It's mine.", options: ["Who", "Whose", "Which", "Why"], correct: 1 },
    { question: "__________ one is your brother? The boy with the red shirt.", options: ["What", "Who", "Whose", "Which"], correct: 3 },
    { question: "__________ are you going to the park? Because I want to play.", options: ["Why", "Where", "When", "What"], correct: 0 },
    { question: "__________ do you live? I live in London.", options: ["Where", "When", "What", "Why"], correct: 0 },
    { question: "__________ is the problem? I can't find my phone.", options: ["When", "What", "Who", "Whose"], correct: 1 },
    { question: "__________ is your test? On Monday.", options: ["Where", "When", "What", "Why"], correct: 1 },
    { question: "__________ is that man's job? He is a chef.", options: ["What", "Who", "Whose", "Which"], correct: 0 },
    { question: "__________ bag is heavier, yours or mine?", options: ["Who", "Which", "Whose", "Why"], correct: 1 },
    { question: "__________ are you from? I'm from Brazil.", options: ["When", "Where", "What", "Who"], correct: 1 },
    { question: "__________ is crying? The baby is crying.", options: ["What", "Why", "Who", "Whose"], correct: 2 },
    { question: "__________ do you usually do on weekends? I visit my family.", options: ["What", "When", "Where", "Why"], correct: 0 },
    { question: "__________ is your address?", options: ["What", "Where", "When", "Why"], correct: 0 },
    { question: "__________ is your favorite singer? Taylor Swift.", options: ["Which", "Who", "Whose", "What"], correct: 1 }
  ];

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

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
  });

  const totalQuestions = questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    studentName: testData.studentName,
    timeSpent: formatTime(testData.timeSpent),
    timeLeft: formatTime(testData.timeLeft),
    score: score,
    correctCount: correctCount,
    wrongCount: wrongCount,
    unansweredCount: unansweredCount,
    leaveCount: testData.leaveCount || 0,
    totalQuestions: totalQuestions,
    detailedResults: questions.map((q, i) => ({
      questionNumber: i + 1,
      question: q.question,
      studentAnswer: testData.answers[i] !== undefined ? q.options[testData.answers[i]] : 'Not answered',
      correctAnswer: q.options[q.correct],
      status: testData.answers[i] === undefined ? 'Unanswered' : (testData.answers[i] === q.correct ? 'Correct' : 'Wrong')
    }))
  };
}

async function sendToTelegram(results) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return false;
  }

  try {
    const bot = new TelegramBot(botToken);
    
    let performance = 'Excellent';
    if (results.score >= 90) performance = '🏆 Outstanding';
    else if (results.score >= 80) performance = '🎯 Excellent';
    else if (results.score >= 70) performance = '👍 Good';
    else performance = '📈 Average';

    const mainReport = `🎓 ENGLISH TEST SUBMISSION

👤 Student: ${results.studentName}
⏱️ Time Spent: ${results.timeSpent}
⏰ Time Left: ${results.timeLeft}
📊 Score: ${results.correctCount}/${results.totalQuestions} (${results.score}%)
✅ Correct: ${results.correctCount}
❌ Wrong: ${results.wrongCount}
⏭️ Unanswered: ${results.unansweredCount}
🚪 Page Leaves: ${results.leaveCount}
📅 Submitted: ${new Date().toLocaleString()}

DETAILED RESULTS:
═══════════════════════════════
`;

    await bot.sendMessage(chatId, mainReport);

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

    if (batch) {
      await bot.sendMessage(chatId, batch);
    }

    const summary = `═══════════════════════════════
SUMMARY
🏆 Final Score: ${results.score}%
📈 Performance: ${performance}`;

    await bot.sendMessage(chatId, summary);
    return true;

  } catch (error) {
    return false;
  }
}
