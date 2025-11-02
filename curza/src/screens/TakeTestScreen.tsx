// src/screens/TakeTestScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { createTestAI, scoreTestAI } from '../../firebase';
import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function TakeTestScreen({ navigation }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ qid: string; id: string }[]>([]);
  const [scored, setScored] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateTest = async () => {
    setLoading(true);
    const res = await createTestAI({
      topic: 'Algebra: Linear Equations',
      grade: 'Grade 9',
      numQuestions: 5,
    });
    const quiz = res.data as { topic: string; questions: any[] };
    setQuestions(quiz.questions);
    setUserAnswers([]); // reset old answers
    setLoading(false);
  };

  const handleSelect = (qid: string, id: string) => {
    setUserAnswers((prev) => {
      const filtered = prev.filter((a) => a.qid !== qid);
      return [...filtered, { qid, id }];
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Send to OpenAI scorer through Firebase Functions
      const res = await scoreTestAI({ questions, answers: { items: userAnswers } });
      const result = res.data as {
        score: number;
        total: number;
        items: any[];
        weakAreas: string[];
      };
      setScored(result);

      // Save result to Firestore
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'attempts', Date.now().toString()), {
          ...result,
          topic: 'Algebra: Linear Equations',
          createdAt: serverTimestamp(),
        });
      }

      // Navigate to Results screen
      navigation.navigate('Results', { result });
    } catch (err) {
      console.error('Error scoring test:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Pressable onPress={handleGenerateTest} disabled={loading}>
        <Text style={{ backgroundColor: '#007bff', color: '#fff', padding: 10, textAlign: 'center' }}>
          {loading ? 'Loading...' : 'Generate Test'}
        </Text>
      </Pressable>

      {questions.map((q, i) => (
        <View key={q.qid} style={{ marginVertical: 15 }}>
          <Text style={{ fontWeight: 'bold' }}>{i + 1}. {q.prompt}</Text>
          {q.options.map((opt: any) => (
            <Pressable
              key={opt.id}
              onPress={() => handleSelect(q.qid, opt.id)}
              style={{
                borderWidth: 1,
                borderColor: userAnswers.find(a => a.qid === q.qid && a.id === opt.id)
                  ? '#007bff'
                  : '#ccc',
                padding: 8,
                marginVertical: 3,
                borderRadius: 6,
              }}>
              <Text>({opt.id}) {opt.text}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      {questions.length > 0 && (
        <Pressable onPress={handleSubmit} disabled={loading}>
          <Text style={{ backgroundColor: '#28a745', color: '#fff', padding: 10, textAlign: 'center' }}>
            Submit Test
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
