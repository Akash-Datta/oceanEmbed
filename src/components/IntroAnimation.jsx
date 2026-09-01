import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";


const IntroAnimation = ({
  isLoaded,
  onFinish,
}) => {

  // ==========================================================
  // ALL WELCOME STATEMENTS
  // ==========================================================

  const greetings = useMemo(
    () => [

      "আপোনাাক আমাৰ ৱেবপেজলৈ স্বাগতম",

      "আমাদের ওয়েবপেজে আপনাকে স্বাগতম",

      "सांतरे वेबपेज पर तुंदा स्वागत ऐ",

      "અમારી વેબપેજ પર આપનું સ્વાગત છે",

      "हमारे वेबपेज पर आपका स्वागत है",

      "ನಮ್ಮ ವೆಬ್‌ಪುಟಕ್ಕೆ ನಿಮಗೆ ಸ್ವಾಗತ",

      "پُنٛنس ویب پۆجس پؠٹھ چھُ توہِہ خوش آمدید",

      "आमच्या वेबपाचेर तुका स्वागत आसा",

      "हमारे वेबपेज पर स्वागत अछि",

      "ഞങ്ങളുടെ വെബ്‌പേജിലേക്ക് സ്വാഗതം",

      "ঐখোয়গী ৱেবপেজদা তরাম্না ওকচরি",

      "आमच्या वेबपेजवर आपले स्वागत आहे",

      "हाम्रो वेबपेजमा तपाईलाई स्वागत छ",

      "ଆମର ୱେବ୍‌ପେଜ୍‌କୁ ସ୍ୱାଗତ",

      "ਸਾਡੇ ਵੈੱਬਪੇਜ 'ਤੇ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",

      "अस्मदीये वेबपुट्जे भवतां स्वागतम्",

      "ᱟᱞᱮᱭᱟᱜ ᱣᱮᱵᱽᱯᱮᱡᱽ ᱨᱮ ᱡᱚᱛᱚ ᱠᱚ ᱜᱮ ᱜᱚᱭᱟᱨ",

      "اسان جي ويب پيج تي اوهان جي مهرباني",

      "எங்கள் வலைப்பக்கத்திற்கு உங்களை வரவேற்கிறோம்",

      "మా వెబ్‌పేజీకి మీకు స్వాగతం",

      "ہمارے ویب صفحے پر خوش آمدید",

      "Welcome to our webpage",

    ],
    []
  );


  // ==========================================================
  // STATE
  // ==========================================================

  const [index, setIndex] = useState(0);

  const [visible, setVisible] = useState(true);


  // ==========================================================
  // REFS
  // ==========================================================

  /*
   * Prevent onFinish from being called more than once.
   */

  const finishCalledRef = useRef(false);


  /*
   * Store the time when the intro started.
   *
   * This is useful for making the animation dynamically faster
   * once the map becomes ready.
   */

  const startTimeRef = useRef(
    Date.now()
  );


  // ==========================================================
  // TIMING
  // ==========================================================

  /*
   * Normal loading:
   *
   * Slow enough for the languages to be visible.
   */

  const normalSpeed = 180;


  /*
   * Once the map is ready:
   *
   * Speed up the remaining greetings so that the sequence
   * doesn't unnecessarily hold the user on the intro screen.
   */

  const finishingSpeed = 70;


  /*
   * Small pause before the final slide exits.
   */

  const finalPause = 650;


  // ==========================================================
  // MAIN GREETING SEQUENCE
  // ==========================================================

  useEffect(() => {

    if (!visible) {
      return;
    }

    if (greetings.length === 0) {
      return;
    }


    /*
     * --------------------------------------------------------
     * LAST GREETING
     * --------------------------------------------------------
     */

    if (
      index ===
      greetings.length - 1
    ) {

      /*
       * If the map is NOT ready yet:
       *
       * Do not exit.
       *
       * Start the sequence again so the user keeps seeing
       * all languages while the huge data/map loads.
       */

      if (!isLoaded) {

        const loopTimer =
          setTimeout(() => {

            setIndex(0);

          }, normalSpeed);

        return () =>
          clearTimeout(loopTimer);
      }


      /*
       * Map is ready AND we've reached the final greeting.
       *
       * Now exit.
       */

      const exitTimer =
        setTimeout(() => {

          if (
            finishCalledRef.current
          ) {
            return;
          }

          finishCalledRef.current = true;

          setVisible(false);

          if (onFinish) {
            onFinish();
          }

        }, finalPause);


      return () =>
        clearTimeout(exitTimer);
    }


    // ========================================================
    // CALCULATE CURRENT SPEED
    // ========================================================

    let currentSpeed = normalSpeed;


    /*
     * Once the map is ready, accelerate the sequence.
     *
     * This is the important part that makes the intro dynamic.
     */

    if (isLoaded) {

      currentSpeed =
        finishingSpeed;

    }


    // ========================================================
    // NEXT GREETING
    // ========================================================

    const timer =
      setTimeout(() => {

        setIndex(
          (previousIndex) =>
            previousIndex + 1
        );

      }, currentSpeed);


    return () =>
      clearTimeout(timer);

  }, [
    index,
    isLoaded,
    visible,
    greetings.length,
    onFinish,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <AnimatePresence>

      {visible && (

        <motion.div

          style={{

            position: "fixed",

            inset: 0,

            zIndex: 99999,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            overflow: "hidden",

            backgroundColor: "#0f172a",

            color: "white",

            padding: "0 20px",

          }}


          /*
           * Intro starts already visible.
           *
           * There is no fade-in delay, which prevents the blank
           * screen that you were seeing before.
           */

          initial={{
            y: 0,
          }}

          animate={{
            y: 0,
          }}


          /*
           * Final upward slide.
           */

          exit={{

            y: "-100%",

            transition: {

              duration: 1.05,

              ease: [
                0.22,
                1,
                0.36,
                1,
              ],

            },

          }}

        >

          <AnimatePresence mode="wait">

            <motion.h1

              key={index}

              style={{

                fontSize:
                  "clamp(2rem, 5vw, 4.5rem)",

                fontWeight: "bold",

                margin: 0,

                textAlign: "center",

                fontFamily:
                  "Inter, sans-serif",

                lineHeight: 1.25,

                maxWidth: "90%",

              }}


              initial={{

                opacity: 0,

                y: 20,

              }}


              animate={{

                opacity: 1,

                y: 0,

              }}


              exit={{

                opacity: 0,

                y: -20,

              }}


              transition={{

                duration: 0.12,

                ease: "easeOut",

              }}

            >

              {greetings[index]}

            </motion.h1>

          </AnimatePresence>

        </motion.div>

      )}

    </AnimatePresence>

  );

};


export default IntroAnimation;