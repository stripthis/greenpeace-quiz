/**
 * Greenpeace Quiz
 * @package     org.greenpeace.js.quiz
 * @author      Team Narwhal (oh yeah!)
 * @copyright   Copyright 2012, Greenpeace International
 * @license     MIT License (opensource.org/licenses/MIT)
 */
$.fn.quiz = (function(config) {

  // Configuration
  // we merge the default and the given data using 'deep' extend feature
  // see. http://api.jquery.com/jQuery.extend/
  config = $.extend(true, {
    baseUrl  : 'http://localhost/greenpeace-quiz',
    dataFile : '/js/greenpeace-quiz.json',
    selector : {
      //container : '', // automatically set @see init
      question  : '.question .sentence',
      correct   : '.answer.result',
      score     : '.score',
      options   : '.answers.options',
      option    : '.answers.options .option a',
      image     : '.illustration',
      next      : '.nextQuestion',
      restart   : '.restart',
      feedback  : '.feedback',
    },
    template : {
      question : '#questionTemplate',
      image    : '#imageTemplate',
      answers  : '#answersTemplate',
      feedback : '#feedbackTemplate',
      score    : '#scoreTemplate',
      gameover : '#gameoverTemplate',
      social   : '#socialTemplate',
    },
    delay : -1 // timer ms delay to autoswitch between answer/question. -1 = manual.
  }, config || {});

  // The plugin return itself 
  // for it also may need to chain itself to stuffs to get things done
  return this.each(function() {
    /**
     * Main Game Data
     */
    var id;              // typically #quiz but could be something else you fancy
    var mcq;             // where questions meet answers
    var mcqLength;       // number of questions 
    var currentScore;    // score of the curent user
    var currentQuestion; // index of the current question in mcq
    var fin;             // end of game stuffs

    /**
     * Initialization method
     * Load the data and get the ball rolling
     * @param string , the application tag id
     */
    function init(o) { 
      id = o;
      config.selector.container = '#' + id;
      // check if the data are not already available
      // only make one Ajax/JSON call 
      if (mcq === undefined) {
        $.getJSON(
          config.baseUrl + config.dataFile,
          function(data) {
            mcq = data[0]['questions'];
            fin = data[0]['gameover'];
            maxScore = mcq.length;
            onReady();
          }
        );
      } else {
        // reset previous answers
        var i = 0;
        for (;i<maxScore;i++) {
          mcq[i]['answer'] = undefined;
        }
        onReady();
      }
    }

    /**
     * Post initialization callback
     */
    function onReady() {
      setScore(0);
      setQuestion(0);
    }

    /**
     * Event callback when the user click on an answer
     * @param object, the link clicked
     * @param int q, the corresponding question index in mcq
     */
    function onAnswerClick(o,q) {
      var a;
      var msg; 
      var clas;

      //unbind click to the answers
      //$(config.selector.option)

      // check if this is the right answer
      a = (o.id[6] === mcq[q]['solution']);
      if (a) {
        setScore(currentScore+1);
      } else {
        setScore(currentScore-1);
      }
      mcq[q]['answer'] = a;

      // Render the feedback template
      renderFeedback();

      // bind click events with answer buttons
      $(config.selector.next).click(function() {
        onNextQuestion();
      });
      // or you could also use a timer if you want
      if (config.delay > 0) {
        window.setTimeout(  
          function() {  
            onNextQuestion();
          },  
          config.delay
        );
      }
    }

    /**
     * Next Question Callback
     * Call the next question or finish the show
     */
    function onNextQuestion() {
      if (currentQuestion+1 < mcq.length) {
        setQuestion(currentQuestion+1);
      } else {
        setGameOver();
      }
    }

    /**
     * Set (and display) the current question
     * @param int q, the corresponding question index in mcq
     */
    function setQuestion(q) {
      var i = 0;
      var l = mcq[q]['options'].length;
      currentQuestion = q;

      // Render the question/answer templates
      renderQuestion();

      // bind click events with answer buttons
      $(config.selector.option).click(function(){
        onAnswerClick(this,q);
      });

    }

    /**
     * When the last question is asked, and the last button clicked,
     * we will realized that we can't eat answers
     */
    function setGameOver() {
      var msg;
      var c = currentScore;
      var i = 0;
      var f = fin;
      var l = f.length;

      // display different text/image depending on the score
      for (; i < l; i++) {
        if (c <= f[i]['threshold']) {
          break;
        }
      }

      // Render the contextual game over screen
      renderGameOver(i);

      // bind init event to restart button
      $(config.selector.restart).click(function(){
        init(id);
      });
    }

    /**
     * Set the current user score
     * @param int s, new score
     */
    function setScore(s) {
      if (s >= 0) {
        currentScore = s;
      }
    }

    /**
     * Render the question template with some taky annimation
     */
    function renderQuestion() {
      var q = currentQuestion;

      // Reset the view
      $(config.selector.container).empty();

      // Render the question template
      $(config.template.question)
        .tmpl([{question : mcq[q]['question']}])
        .appendTo(config.selector.container);

      // Render the answers template
      $(config.template.answers)
        .tmpl(mcq[q]['options'])
        .appendTo(config.selector.options);

      $(config.selector.container)
        .css({'margin-left':'100%'})     
        .animate({
          'margin-left': '0%'
        }, 100, 'linear');

      // Render the image template
      $(config.selector.container)
        .css('background','transparent url('+mcq[q]['image'][0].url+') right 100px no-repeat')
        .animate({
          'background-position-y': '0px'
        }, 100, 'linear');
    }

    /**
     * Render feedback depending on answer
     */
    function renderFeedback() {
      var q = currentQuestion;
      var correct = mcq[q]['answer'];
      var msg;

      // message and class change
      if (correct) {
        correct = 'correct';
        msg = mcq[q]['feedback'][1];
      } else  {
        correct = 'wrong';
        msg = mcq[q]['feedback'][0];
      };

      // Reset the view
      $(config.selector.container)
        .empty();

      // Render template
      $(config.template.feedback)
        .tmpl([{
          correct : correct,
          msg : msg
        }])
        .appendTo(config.selector.container)

    }

    /**
     * Render GameOver  
     * The show isn't over until the fat lady sings
     * @param i int, the index of the dynamic finish message/image that applies
     */
    function renderGameOver(i) {
      // Reset the view
      $(config.selector.container)
        .empty();

      $(config.template.gameover)
        .tmpl([{
          msg          : fin[i]['text'],
          currentScore : currentScore,
          maxScore     : maxScore
        }])
        .appendTo(config.selector.container);

      renderScore();

      $(config.template.social)
        .tmpl([{
          msg : fin[i].social
        }])
        .appendTo(config.selector.container);

      $(config.selector.container)
        .animate({
          'background-position-y': '130px'
        }, 100, 'linear')
        .css({'margin-left':'100%'})
        .animate({
          'margin-left': '0'
        }, 100, 'linear');

      // Render the image template
      $(config.selector.container)
        .css('background','transparent url('+fin[i]['image'][0]['url']+') right 100px no-repeat')
        .animate({
          'background-position-y': '0px'
        }, 100, 'linear');
    }

    /**
     * Render Score
     */
    function renderScore() {
      // Render the score template
      // make sure question have been rendered
      $(config.template.score)
        .tmpl([{
          currentScore : currentScore,
          maxScore     : maxScore
        }])
        .appendTo(config.selector.score);
    }

    // Go quiz, give them hell!
    init(this.id);
  });
});
/*
                        /
        .-.            /
   .--./ /      _.---./
    '-,  (__..-`       \
       \                |
        `,.__.   ^___.-/
          `-./ .'...--`
             `’
            ☮ & ♥ 
 */
$('#quiz').quiz({
  //dataFile : 'greenpeace-quiz-fr_fr.json'
});
