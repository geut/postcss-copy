# Contributing to postcss-copy

## Issue Contributions

When opening new issues or commenting on existing issues on this repository
please make sure discussions are related to concrete technical issues with the
*postcss-copy* plugin.

Try to be *friendly* (we are not animals :monkey: or bad people :rage4:) and explain correctly how we can reproduce your issue.
  - Share the version of our plugin and PostCSS that you are using.
  - Share your PostCSS configuration.

## Code Contributions

This document will guide you through the contribution process.

### Step 1: Fork

Fork the project [on GitHub](https://github.com/geut/postcss-copy) and check out your copy locally.

```text
$ git clone git@github.com:username/postcss-copy.git
$ cd postcss-copy
$ git remote add upstream git://github.com/geut/postcss-copy.git
```

#### Which branch?

For developing new features and bug fixes, the `master` branch should be pulled
and built upon.

### Step 2: Branch

Create a feature branch and start hacking:

```text
$ git checkout -b my-feature-branch -t origin/master
```

### Step 3: Test

Bug fixes and features **should come with tests**. We use [AVA](https://github.com/avajs/ava) to do that.

```text
$ npm test
```

Make sure the linter is happy and that all tests pass. Please, do not submit
patches that fail either check.

### Step 4: Commit

Make sure git knows your name and email address:

```text
$ git config --global user.name "J. Random User"
$ git config --global user.email "j.random.user@example.com"
```

Writing good commit logs is important. A commit log should describe what
changed and why.

### Step 5: Push

```text
$ git push origin my-feature-branch
```

### Step 6: Make a pull request ;)
