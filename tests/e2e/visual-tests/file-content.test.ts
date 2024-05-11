import { expect, test } from '@playwright/test';
import { createFixtureFile } from '../utils/fixtures';
import { openElectronApp } from '../utils/render';
import { waitForLineToLoad } from '../utils/wait-helpers';

test.describe('Visual testing - File Content', () => {
  test('should display line numbers matching the text correctly', async () => {
    const lines = [
      'I told you, I don’t want to join your super-secret boy band. —Tony Stark to Nick Fury when asked to join the Avengers in Iron Man 2',
      'Nothing goes over my head. My reflexes are too fast. I would catch it. —Drax in Guardians of the Galaxy',
      'Doth mother know you weareth her drapes? —Tony Stark, upon meeting Thor in The Avengers',
      'I’m made of rocks, as you can see, but don’t let that intimidate you. You don’t need to be afraid unless you’re made of scissors! Just a little rock-paper-scissors joke for you! —Korg in Thor: Ragnarok',
      'Don’t scare me like that, colonizer. —Shuri to Everett Ross in Black Panther',
      'Just Wong? Like Adele? Or Aristotle? Drake. Bono. Eminem. —Stephen Strange when introduced to Wong in Doctor Strange',
      'This is a man. … It’s like a pirate had a baby with an angel. —Drax describing Thor in Avengers: Infinity War',
      'Honestly, until this exact second, I thought you were a Build-a-Bear. —Tony Stark to Rocket Raccoon in Avengers: Endgame',
      'What master do I serve? What am I supposed to say? Jesus? —Peter Quill in Avengers: Infinity War',
      'Dude, you’re embarrassing me in front of the wizards. —Tony Stark to Hulk in Avengers: Infinity War',
      'Mew-mew? What’s mew-mew? —Darcy Lewis, trying to pronounce “Mjolnir in Thor',
      'Someone peed my pants! Not sure if it was the baby me or the old me. Or was it just me-me? —Ant-Man in Avengers: Endgame',
      'It’s good to meet you, Dr. Banner. Your work on anti-electron collisions is unparalleled. And I’m a huge fan of the way you lose control and turn into an enormous green rage monster. —Tony Stark in The Avengers',
      'You call me ‘young lady’ again, I’ll shove my foot up somewhere it’s not supposed to be. —Maria Rambeau in Captain Marvel',
      'Have you ever tried shawarma? There’s a shawarma joint about two blocks from here. —Tony Stark in The Avengers',
      'I choose to run toward my problems and not away from them. Because’s that … because that’s what heroes do. —Thor in Thor: Ragnarok',
      'It’s not enough to be against something. You have to be for something better. —Tony Stark in Captain America: Civil War',
      'Victory at the expense of the innocent is no victory at all. —King T’Chaka in Captain America: Civil War',
      'No man can win every battle, but no man should fall without a struggle. —Peter Parker in Spider-Man: Homecoming',
      'Just because something works doesn’t mean it can’t be improved. —Shuri in Black Panther',
      'If you’re nothing without this suit, then you shouldn’t have it. —Tony Stark to Peter Parker in Spider-Man: Homecoming',
      'Everyone fails at who they’re supposed to be, Thor. The measure of a person, of a hero, is how well they succeed at being who they are. —Frigga to her son Thor in Avengers: Endgame',
      'I would rather be a good man than a great king. —Thor in Thor: The Dark World',
      'I know you were only doing what you believe in, and that’s all any of us can do. It’s all any of us should. —Captain America in Captain America: Civil War',
      'No amount of money ever bought a second of time. —Tony Stark in Avengers: Endgame',
      'We never lose our demons, Mordo. We only learn to live above them. —The Ancient One in Doctor Strange',
      'Today we don’t fight for one life. We fight for all of them. —T‘Challa in Avengers: Infinity War',
      'All we can do is our best, and sometimes the best that we can do is to start over. —Peggy Carter in Captain America: The First Avenger',
      'In times of crisis, the wise build bridges, while the foolish build barriers. We must find a way to look after one another, as if we were one single tribe. —T‘Challa in Black Panther',
      'You hope for the best and make do with what you get. —Nick Fury in Avengers: Age of Ultron',
      'The hardest choices require the strongest wills. —Thanos in Avengers: Infinity War',
    ];
    const { filePath } = await createFixtureFile({
      content: lines.join('\n'),
    });

    const { page } = await openElectronApp({
      filePath,
    });

    await waitForLineToLoad(page, lines[0]);

    await expect(page).toHaveScreenshot(
      'file-content-without-color-matching-line-number.png',
    );
  });
});
