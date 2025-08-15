import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-big-calendar';
import dayjs from 'dayjs';

export default function ScheduleCalendar({ schedules = [] }) {
  const events = schedules.map((schedule) => ({
    title: `Shift (${schedule.pay_per_hour}/hr)`,
    start: dayjs(`${schedule.date} ${schedule.start}`).toDate(),
    end: dayjs(`${schedule.date} ${schedule.end}`).toDate(),
  }));

  return (
    <View style={styles.container}>
      <Calendar events={events} height={600} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
