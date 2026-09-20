import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  createClient
} from "@supabase/supabase-js";

import {
  GoogleGenAI
} from "@google/genai";


dotenv.config();


const app = express();


app.use(
  cors({
    origin: true,
    credentials: true
  })
);


app.use(express.json());


/* ==========================================
   CLIENTS
========================================== */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


/* ==========================================
   SYSTEM INSTRUCTIONS
========================================== */

const SYSTEM_INSTRUCTION = `
You are Niveau AI.

You are a helpful AI assistant inside the Niveau AI platform.

Your capabilities include:
- answering questions
- helping with programming
- creating website code
- brainstorming ideas
- explaining concepts
- helping with writing

Safety rules:
- Do not help users perform illegal activities.
- Do not provide instructions for harmful wrongdoing.
- Do not expose private information.
- Do not claim to have performed actions you did not perform.
- Be honest about limitations.
- If a request is unsafe or illegal, refuse that part and offer a safe alternative.

Always be helpful, clear and concise.
`;


/* ==========================================
   AUTHENTICATE USER
========================================== */

async function authenticateUser(req) {

  const authHeader =
    req.headers.authorization;


  if (!authHeader) {

    return null;

  }


  const token =
    authHeader.replace(
      "Bearer ",
      ""
    );


  if (!token) {

    return null;

  }


  const {
    data,
    error
  } =
    await supabase.auth.getUser(
      token
    );


  if (error || !data.user) {

    return null;

  }


  return data.user;

}


/* ==========================================
   CHAT
========================================== */

app.post(
  "/api/chat",
  async (req, res) => {

    try {

      const user =
        await authenticateUser(req);


      if (!user) {

        return res
          .status(401)
          .json({
            error: "Unauthorized"
          });

      }


      const {
        conversationId,
        message
      } = req.body;


      if (!message) {

        return res
          .status(400)
          .json({
            error: "Message is required"
          });

      }


      /* ------------------------------------
         CREATE CONVERSATION IF NECESSARY
      ------------------------------------ */

      let activeConversationId =
        conversationId;


      if (!activeConversationId) {

        const {
          data: conversation,
          error
        } =
          await supabase
            .from("conversations")
            .insert({

              user_id: user.id,

              title:
                message.substring(
                  0,
                  60
                )

            })
            .select()
            .single();


        if (error) {

          throw error;

        }


        activeConversationId =
          conversation.id;

      }


      /* ------------------------------------
         SAVE USER MESSAGE
      ------------------------------------ */

      const {
        error: userMessageError
      } =
        await supabase
          .from("messages")
          .insert({

            conversation_id:
              activeConversationId,

            user_id:
              user.id,

            role: "user",

            content: message

          });


      if (userMessageError) {

        throw userMessageError;

      }


      /* ------------------------------------
         GET HISTORY
      ------------------------------------ */

      const {
        data: history,
        error: historyError
      } =
        await supabase
          .from("messages")
          .select(
            "role, content"
          )
          .eq(
            "conversation_id",
            activeConversationId
          )
          .order(
            "created_at",
            {
              ascending: true
            }
          );


      if (historyError) {

        throw historyError;

      }


      /* ------------------------------------
         GEMINI CONTENT
      ------------------------------------ */

      const contents =
        history.map(
          item => ({

            role:
              item.role === "assistant"
                ? "model"
                : "user",

            parts: [
              {
                text:
                  item.content
              }
            ]

          })
        );


      /* ------------------------------------
         GENERATE AI RESPONSE
      ------------------------------------ */

      const response =
        await ai.models.generateContent({

          model:
            "gemini-3.8-flash",

          contents,

          config: {

            systemInstruction:
              SYSTEM_INSTRUCTION

          }

        });


      const answer =
        response.text;


      /* ------------------------------------
         SAVE AI MESSAGE
      ------------------------------------ */

      const {
        error: assistantError
      } =
        await supabase
          .from("messages")
          .insert({

            conversation_id:
              activeConversationId,

            user_id:
              user.id,

            role: "assistant",

            content:
              answer

          });


      if (assistantError) {

        throw assistantError;

      }


      /* ------------------------------------
         UPDATE CONVERSATION
      ------------------------------------ */

      await supabase
        .from("conversations")
        .update({

          updated_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          activeConversationId
        )
        .eq(
          "user_id",
          user.id
        );


      return res.json({

        conversationId:
          activeConversationId,

        message:
          answer

      });

    }

    catch (error) {

      console.error(
        "CHAT ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Something went wrong."

        });

    }

  }
);


/* ==========================================
   GET CONVERSATIONS
========================================== */

app.get(
  "/api/conversations",
  async (req, res) => {

    try {

      const user =
        await authenticateUser(req);


      if (!user) {

        return res
          .status(401)
          .json({
            error: "Unauthorized"
          });

      }


      const {
        data,
        error
      } =
        await supabase
          .from("conversations")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "updated_at",
            {
              ascending: false
            }
          );


      if (error) {

        throw error;

      }


      res.json(data);

    }

    catch (error) {

      console.error(error);

      res
        .status(500)
        .json({
          error:
            "Failed to load conversations"
        });

    }

  }
);


/* ==========================================
   GET MESSAGES
========================================== */

app.get(
  "/api/conversations/:id/messages",
  async (req, res) => {

    try {

      const user =
        await authenticateUser(req);


      if (!user) {

        return res
          .status(401)
          .json({
            error: "Unauthorized"
          });

      }


      const conversationId =
        req.params.id;


      const {
        data: conversation
      } =
        await supabase
          .from("conversations")
          .select("id")
          .eq(
            "id",
            conversationId
          )
          .eq(
            "user_id",
            user.id
          )
          .single();


      if (!conversation) {

        return res
          .status(404)
          .json({
            error:
              "Conversation not found"
          });

      }


      const {
        data,
        error
      } =
        await supabase
          .from("messages")
          .select("*")
          .eq(
            "conversation_id",
            conversationId
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: true
            }
          );


      if (error) {

        throw error;

      }


      res.json(data);

    }

    catch (error) {

      console.error(error);

      res
        .status(500)
        .json({
          error:
            "Failed to load messages"
        });

    }

  }
);


/* ==========================================
   SERVER
========================================== */

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  () => {

    console.log(
      `Niveau AI backend running on port ${PORT}`
    );

  }
);
