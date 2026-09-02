import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const IntroAnimation = ({ isLoaded, onFinish }) => {
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
      "ਸਾਡੇ ਵੈੱਬਪੇਜ 'ਤੇ ਤੁਹਾਡਾ ਸਵਾਗതം ਹੈ",
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

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isLoaded || !visible) {
      return;
    }

    const timer = setTimeout(() => {
      setIndex((previous) => {
        if (previous < greetings.length - 1) {
          return previous + 1;
        }
        return previous; // Stop looping and stay on the final greeting ("Welcome to our webpage")
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [index, isLoaded, visible, greetings.length]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setVisible(false);

    if (onFinish) {
      onFinish();
    }
  }, [isLoaded, onFinish]);

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
          initial={{ y: 0 }}
          animate={{ y: 0 }}
          exit={{
            y: "-100%",
            transition: {
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={index}
              style={{
                fontSize: "clamp(2rem, 5vw, 4.5rem)",
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.25,
                maxWidth: "90%",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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